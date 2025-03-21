import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase-admin'; // Import Firebase Admin SDK
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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

// Mark attendance API endpoint
export async function GET(req: Request) {
  console.log("[markAttendance] GET method called");
  const { searchParams } = new URL(req.url);
  const qrResult = searchParams.get('qrResult');

  // Check if Firebase Admin SDK is properly initialized
  if (!adminDb) {
    console.error("[markAttendance] Firebase Admin SDK not initialized");
    return NextResponse.json(
      { error: "Database connection failed", message: "Firebase Admin SDK not initialized" },
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!qrResult) {
    console.error("[markAttendance] QR result missing in request");
    return NextResponse.json(
      { error: "Bad request", message: "QR result is required" },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`[markAttendance] Looking up participant with ID: ${qrResult}`);
    
    // Get participant data
    const participantRef = adminDb.collection('participants').doc(qrResult);
    const doc = await participantRef.get();
    
    if (!doc.exists) {
      console.warn(`[markAttendance] Participant not found: ${qrResult}`);
      return NextResponse.json({ 
        error: 'Participant not found' 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const participantData = doc.data() as ParticipantData;
    console.log(`[markAttendance] Found participant: ${participantData.name}`);
    
    // Return participant data
    return NextResponse.json({
      name: participantData?.name,
      email: participantData?.email,
      regno: participantData?.regno,
      attend: participantData?.attend || false,
      timestamp: participantData?.timestamp,
      inTimestamp: participantData?.inTimestamp,
      outTimestamp: participantData?.outTimestamp,
      isInside: participantData?.isInside,
      markedBy: Array.isArray(participantData?.markedBy) ? participantData.markedBy : []
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("[markAttendance] Error looking up participant:", error);
    return NextResponse.json(
      { error: "Failed to lookup participant", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST method to mark attendance
export async function POST(req: Request) {
  console.log("[markAttendance] POST method called");
  
  // Check if Firebase Admin SDK is properly initialized
  if (!adminDb) {
    console.error("[markAttendance] Firebase Admin SDK not initialized");
    return NextResponse.json(
      { error: "Database connection failed", message: "Firebase Admin SDK not initialized" },
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    console.log("[markAttendance] Request body:", body);
    
    const { qrResult, qrResultTimestamp, userName, attendanceType = 'in' } = body;
    
    if (!qrResult) {
      console.warn('[markAttendance] Missing QR result in request body');
      return NextResponse.json({ 
        error: 'Missing QR result' 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Get participant reference
    console.log(`[markAttendance] Looking up participant with ID: ${qrResult}`);
    const participantRef = adminDb.collection('participants').doc(qrResult);
    const doc = await participantRef.get();
    
    if (!doc.exists) {
      console.warn(`[markAttendance] Participant not found: ${qrResult}`);
      return NextResponse.json({ 
        error: 'Participant not found' 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const participantData = doc.data() as ParticipantData;
    console.log(`[markAttendance] Found participant: ${participantData.name}, current status: isInside=${participantData.isInside}`);
    
    const currentStatus = participantData?.isInside;
    
    // Prevent duplicate entry/exit records
    if (attendanceType === 'in' && currentStatus === true) {
      console.warn(`[markAttendance] Participant ${participantData.name} is already inside`);
      return NextResponse.json({ 
        error: 'Already inside',
        message: 'Participant is already inside the hall'
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (attendanceType === 'out' && currentStatus === false) {
      console.warn(`[markAttendance] Participant ${participantData.name} is already outside`);
      return NextResponse.json({ 
        error: 'Already outside',
        message: 'Participant is already outside the hall'
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Base update data - always mark as attended
    const updateData: Record<string, unknown> = {
      attend: true,
      timestamp: qrResultTimestamp || new Date().toISOString(),
      lastUpdated: FieldValue.serverTimestamp(),
    };
    
    // Update based on whether it's an entry or exit
    if (attendanceType === 'in') {
      updateData.inTimestamp = qrResultTimestamp || new Date().toISOString();
      updateData.isInside = true;
      // Don't clear outTimestamp when re-entering
    } else if (attendanceType === 'out') {
      updateData.outTimestamp = qrResultTimestamp || new Date().toISOString();
      updateData.isInside = false;
    }
    
    // Update markedBy array - append if not exists
    if (userName) {
      const currentMarkedBy = participantData?.markedBy || [];
      if (!Array.isArray(currentMarkedBy) || !currentMarkedBy.includes(userName)) {
        updateData.markedBy = FieldValue.arrayUnion(userName);
      }
    }
    
    // Update participant data
    console.log(`[markAttendance] Updating participant ${participantData.name} with:`, updateData);
    await participantRef.update(updateData);
    console.log(`[markAttendance] Successfully updated participant ${participantData.name}`);
    
    // Return success response with update type
    return NextResponse.json({
      success: true,
      action: attendanceType === 'in' ? 'Entry recorded' : 'Exit recorded',
      timestamp: qrResultTimestamp,
      isInside: updateData.isInside,
      markedBy: Array.isArray(participantData?.markedBy) 
        ? [...participantData.markedBy, ...(userName && !participantData.markedBy.includes(userName) ? [userName] : [])]
        : [userName]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("[markAttendance] Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// New API endpoint for batch marking multiple attendances at once
export async function PUT(req: Request) {
  console.log("[markAttendance] PUT method called");
  
  // Check if Firebase Admin SDK is properly initialized
  if (!adminDb) {
    console.error("[markAttendance] Firebase Admin SDK not initialized");
    return NextResponse.json(
      { error: "Database connection failed", message: "Firebase Admin SDK not initialized" },
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    console.log("[markAttendance] PUT request body:", body);
    
    const { id, updateData } = body;
    
    if (!id || !updateData) {
      console.warn('[markAttendance] Missing required fields in PUT request');
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get participant reference
    console.log(`[markAttendance] Looking up participant with ID: ${id}`);
    const participantRef = adminDb.collection('participants').doc(id);
    const doc = await participantRef.get();
    
    if (!doc.exists) {
      console.warn(`[markAttendance] Participant not found: ${id}`);
      return NextResponse.json({ 
        error: 'Participant not found' 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add lastUpdated timestamp
    const finalUpdateData = {
      ...updateData,
      lastUpdated: FieldValue.serverTimestamp()
    };
    
    // Update participant data
    console.log(`[markAttendance] Updating participant ${id} with PUT:`, finalUpdateData);
    await participantRef.update(finalUpdateData);
    console.log(`[markAttendance] Successfully updated participant ${id} with PUT`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Participant updated successfully'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("[markAttendance] Error updating participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
