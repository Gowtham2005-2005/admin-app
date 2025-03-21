import { NextResponse } from 'next/server';
import { adminDb } from '../../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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

export async function GET() {
  console.log("[getOutsideParticipants] API called");

  // Check if Firebase Admin SDK is properly initialized
  if (!adminDb) {
    console.error("[getOutsideParticipants] Firebase Admin SDK not initialized");
    return NextResponse.json(
      { error: "Database connection failed", message: "Firebase Admin SDK not initialized" },
      { status: 503 }
    );
  }

  try {
    // Fetch participants who have attended - modified query to avoid composite index requirement
    const participantsRef = adminDb.collection('participants');
    console.log("[getOutsideParticipants] Fetching participants who attended");
    
    // Option 1: Remove the orderBy to avoid needing a composite index
    const snapshot = await participantsRef
      .where('attend', '==', true)
      .get();

    if (snapshot.empty) {
      console.log("[getOutsideParticipants] No participants found who attended");
      return NextResponse.json({ participants: [], total: 0 }, { status: 200 });
    }

    // Filter participants who are outside
    const outsideParticipants = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ParticipantData & { id: string }))
      .filter(participant => participant.isInside === false);

    // Sort the filtered results in memory instead of in the query
    outsideParticipants.sort((a, b) => {
      const timeA = a.lastUpdated ? a.lastUpdated.toMillis() : 0;
      const timeB = b.lastUpdated ? b.lastUpdated.toMillis() : 0;
      return timeB - timeA; // Sort in descending order
    });

    console.log(`[getOutsideParticipants] Found ${outsideParticipants.length} participants outside`);

    // Process timestamps to prevent circular JSON serialization issues
    const processedParticipants = outsideParticipants.map(participant => ({
      ...participant,
      lastUpdated: participant.lastUpdated ? participant.lastUpdated.toDate().toISOString() : null
    }));

    return NextResponse.json({ 
      participants: processedParticipants, 
      total: processedParticipants.length 
    }, { status: 200 });
  } catch (error) {
    console.error("[getOutsideParticipants] Error occurred:", error instanceof Error ? error.message : "Unknown error");
    
    return NextResponse.json({ 
      error: "Failed to fetch outside participants", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}