import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, setDoc, increment, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState
} from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Participant = {
  id: string;
  name: string;
  degree: string;
  department: string;
  experienceResponse: string;
  resilienceResponse: string;
  goalsResponse: string;
  email: string;
  selected: boolean;
};

const updateParticipantSelection = async (participant: Participant) => {
  try {
    const participantRef = doc(db, "participants", participant.id);
    const selectedCounterRef = doc(db, "selected", "selected");

    // First update the participant's selection status
    await updateDoc(participantRef, {
      selected: participant.selected,
    });

    // Get the current counter document
    const selectedDoc = await getDoc(selectedCounterRef);
    
    if (!selectedDoc.exists()) {
      // Create the document if it doesn't exist, initialize with 1 or 0 based on selection
      await setDoc(selectedCounterRef, { count: participant.selected ? 1 : 0 });
    } else {
      // Update the counter based on selection status
      await updateDoc(selectedCounterRef, {
        count: increment(participant.selected ? 1 : -1)
      });
    }
  } catch (error) {
    console.error("Error updating participant selection: ", error);
  }
};

type DataTableDemoProps = {
  participants: Participant[];
  onSelectionChange: (updatedParticipant: Participant) => void;
};

export const DataTableDemo = ({ participants: initialParticipants, onSelectionChange }: DataTableDemoProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    // Set up real-time listener for the selected count
    const selectedCounterRef = doc(db, "selected", "selected");
    const unsubscribe = onSnapshot(selectedCounterRef, (doc) => {
      if (doc.exists()) {
        setSelectedCount(doc.data().count || 0);
      } else {
        setSelectedCount(0);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (participant: Participant, newValue: boolean) => {
  setCurrentParticipant({ ...participant, selected: newValue });
  setConfirmDialogOpen(true);
};

const confirmSelectionUpdate = async () => {
  if (currentParticipant) {
    // Update Firestore
    await updateParticipantSelection(currentParticipant);

    // Notify parent to update local state
    onSelectionChange(currentParticipant);

    // Close dialog
    setConfirmDialogOpen(false);
    setCurrentParticipant(null);
  }
};

  const columns: ColumnDef<Participant>[] = [
    {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => {
      const participant = row.original;

      return (
        <>
          <Checkbox
            checked={participant.selected}
            onCheckedChange={(value) => handleCheckboxChange(participant, !!value)}
            aria-label="Select row"
          />

          {/* AlertDialog for confirmation */}
          {currentParticipant?.id === participant.id && (
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{currentParticipant.selected ? "Confirm Selection" : "Ditch This Person"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to mark this participant as{" "}
                    {currentParticipant.selected ? "selected" : "not selected"}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={confirmSelectionUpdate}>
                    Confirm
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      );
    },
  },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className='space-x-2'>
          <span>Name</span>
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "degree",
      header: "Degree",
      cell: ({ row }) => <div>{row.getValue("degree")}</div>,
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => <div>{row.getValue("department")}</div>,
    },
    {
      accessorKey: "experienceResponse",
      header: "Experience Contribution",
      cell: ({ row }) => {
        const response = row.getValue("experienceResponse") as string;
        const previewText =
          response.length > 10 ? `${response.slice(0, 10)}...` : response;
        return (
          <HoverCard>
            <HoverCardTrigger>
              <div>
                {previewText}{" "}
                {response.length > 20 && (
                  <span className="text-red-500 underline cursor-pointer">
                    Read more
                  </span>
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent>{response}</HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      accessorKey: "resilienceResponse",
      header: "What is Resilience?",
      cell: ({ row }) => {
        const response = row.getValue("resilienceResponse") as string;
        const previewText =
          response.length > 10 ? `${response.slice(0, 10)}...` : response;
        return (
          <HoverCard>
            <HoverCardTrigger>
              <div>
                {previewText}{" "}
                {response.length > 20 && (
                  <span className="text-red-500 underline cursor-pointer">
                    Read more
                  </span>
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent>{response}</HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      accessorKey: "goalsResponse",
      header: "How TEDxSIST Helps",
      cell: ({ row }) => {
        const response = row.getValue("goalsResponse") as string;
        const previewText =
          response.length > 10 ? `${response.slice(0, 10)}...` : response;
        return (
          <HoverCard>
            <HoverCardTrigger>
              <div>
                {previewText}{" "}
                {response.length > 20 && (
                  <span className="text-red-500 underline cursor-pointer">
                    Read more
                  </span>
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent>{response}</HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const participant = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(participant.id)}
              >
                Copy Participant ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: initialParticipants,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="Filter by names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No participants available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>


    <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedCount} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}