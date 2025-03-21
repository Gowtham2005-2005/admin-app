'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExcelDownloadButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Call the API endpoint to generate the Excel file
      const response = await fetch('/api/export-participants', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate Excel file');
      }
      
      // Create a hidden download link and trigger click
      const downloadLink = document.createElement('a');
      downloadLink.href = data.url;
      downloadLink.download = 'participants.xlsx';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success(`Excel file with ${data.count} participants downloaded successfully`);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      toast.error('Failed to download Excel file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isLoading}
      className="w-9 h-9 p-0 sm:w-auto sm:h-auto sm:px-3 sm:py-2 flex items-center justify-center gap-1 sm:gap-2"
      aria-label={isLoading ? "Generating Excel file" : "Download Excel file"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="hidden sm:inline-block">
        {isLoading ? 'Generating...' : 'Download Excel'}
      </span>
    </Button>
  );
}