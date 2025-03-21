import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

interface ParticipantData {
  name?: string;
  email?: string;
  regno?: string;
  attend?: boolean;
  timestamp?: string;
  inTimestamp?: string;
  outTimestamp?: string;
  isInside?: boolean;
  markedBy?: string[];
  lastUpdated?: Timestamp;
}

// Check Firebase Admin initialization before handling requests
function checkFirebaseAdmin() {
  if (!adminDb) {
    console.error('Firebase Admin not initialized');
    return null;
  }
  return adminDb;
}

// Error response helper function
function createErrorResponse(message: string, details: string, status: number) {
  console.error(`[API Error] ${message}: ${details}`);
  return NextResponse.json(
    { error: message, message: details },
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// Get participants who are currently inside
export async function GET() {
  console.log("[getAttendedParticipants] API called");

  const db = checkFirebaseAdmin();
  if (!db) {
    return createErrorResponse(
      "Database connection failed", 
      "Firebase Admin SDK not initialized", 
      503
    );
  }

  try {
    // First, fetch only participants who are inside
    // This query should work without a composite index
    const participantsRef = db.collection('participants');
    console.log("[getAttendedParticipants] Fetching participants who are inside");
    
    const snapshot = await participantsRef
      .where('attend', '==', true)
      .get();

    if (snapshot.empty) {
      console.log("[getAttendedParticipants] No participants found who are inside");
      return NextResponse.json(
        { participants: [], total: 0 },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process the results
    const insideParticipants = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as ParticipantData & { id: string }));

    console.log(`[getAttendedParticipants] Found ${insideParticipants.length} participants inside`);

    // Process timestamps to prevent circular JSON serialization issues
    const processedParticipants = insideParticipants.map(participant => ({
      ...participant,
      lastUpdated: participant.lastUpdated ? participant.lastUpdated.toDate().toISOString() : null
    }));

    // Sort the results in memory
    processedParticipants.sort((a, b) => {
      const aDate = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const bDate = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return bDate - aDate;  // Descending order
    });

    return NextResponse.json(
      { participants: processedParticipants, total: processedParticipants.length },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return createErrorResponse(
      "Failed to fetch attended participants", 
      error instanceof Error ? error.message : "Unknown error", 
      500
    );
  }
}

// POST method to mark attendance (entry or exit)
export async function POST(request: NextRequest) {
  try {
    const db = checkFirebaseAdmin();
    if (!db) {
      return createErrorResponse(
        "Service unavailable", 
        "Database connection error. Please try again later.",
        503
      );
    }

    // Parse request body
    const { qrResult, qrResultTimestamp, userName, attendanceType = 'in' } = await request.json();
    
    if (!qrResult) {
      return createErrorResponse("Missing QR result", "QR code value is required", 400);
    }
    
    // Get participant reference
    const participantRef = db.collection('participants').doc(qrResult);
    const doc = await participantRef.get();
    
    if (!doc.exists) {
      return createErrorResponse("Participant not found", "No participant found with this ID", 404);
    }

    const participantData = doc.data() as ParticipantData;
    const currentStatus = participantData?.isInside;
    
    // Prevent duplicate entry/exit records
    if (attendanceType === 'in' && currentStatus === true) {
      return createErrorResponse(
        "Already inside",
        "Participant is already inside the hall",
        400
      );
    }
    
    if (attendanceType === 'out' && currentStatus === false) {
      return createErrorResponse(
        "Already outside",
        "Participant is already outside the hall",
        400
      );
    }
    
    // Get current timestamp
    const currentTimestamp = qrResultTimestamp || new Date().toISOString();
    
    // Base update data - always mark as attended
    const updateData: Record<string, unknown> = {
      attend: true,
      timestamp: currentTimestamp,
      lastUpdated: FieldValue.serverTimestamp(),
    };
    
    // Update based on whether it's an entry or exit
    if (attendanceType === 'in') {
      updateData.inTimestamp = currentTimestamp;
      updateData.isInside = true;
    } else if (attendanceType === 'out') {
      updateData.outTimestamp = currentTimestamp;
      updateData.isInside = false;
    }
    
    // Update markedBy array - append if not exists
    if (userName) {
      updateData.markedBy = Array.isArray(participantData?.markedBy) 
        ? (!participantData.markedBy.includes(userName) 
            ? FieldValue.arrayUnion(userName)
            : participantData.markedBy)
        : [userName];
    }
    
    // Update participant data
    await participantRef.update(updateData);
    
    // Prepare markedBy array for response
    const updatedMarkedBy = Array.isArray(participantData?.markedBy) 
      ? [...participantData.markedBy, ...(userName && !participantData.markedBy.includes(userName) ? [userName] : [])]
      : [userName].filter(Boolean);
    
    // Return success response
    return NextResponse.json({
      success: true,
      action: attendanceType === 'in' ? 'Entry recorded' : 'Exit recorded',
      timestamp: currentTimestamp,
      isInside: updateData.isInside as boolean,
      markedBy: updatedMarkedBy
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse(
      "Failed to mark attendance",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}