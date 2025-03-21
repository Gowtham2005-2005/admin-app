import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { adminDb } from '@/firebase-admin'; // Ensure this file properly initializes Firestore Admin SDK

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to generate an Excel buffer
function generateExcel(data: Record<string, unknown>[]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Participants');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

// Function to delete existing file in Cloudinary
async function clearExistingExcelFile() {
  try {
    await cloudinary.uploader.destroy('tedx-certificates/excel/participants', { resource_type: 'raw' });
    console.log('Previous Excel file deleted from Cloudinary');
  } catch (error) {
    console.warn('No previous Excel file found or deletion failed:', error);
  }
}

// Function to fetch participants data from Firestore
// Function to fetch participants data from Firestore
async function fetchParticipantsFromFirebase() {
  try {
    if (!adminDb) throw new Error('Firebase Admin SDK not initialized properly');

    const participantsSnapshot = await adminDb.collection('participants').get();
    if (participantsSnapshot.empty) {
      console.log('No participants found');
      return [];
    }

    return participantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching participants:', error.message);
    } else {
      console.error('Unknown error occurred while fetching participants:', error);
    }
    throw error;
  }
}

// GET handler to generate and upload Excel file
export async function GET() {
  try {
    console.log('Generating Excel file from Firestore data...');

    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary API configuration');
    }

    const participantsData = await fetchParticipantsFromFirebase();
    if (participantsData.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No participants data found' },
        { status: 404 }
      );
    }

    const excelBuffer = generateExcel(participantsData);
    const tempFilePath = path.join(os.tmpdir(), 'participants.xlsx');
    await writeFile(tempFilePath, excelBuffer);

    await clearExistingExcelFile();

    const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'tedx-certificates/excel',
      public_id: 'participants',
      resource_type: 'raw',
      format: 'xlsx',
      overwrite: true,
      use_filename: true,
      unique_filename: false
    });

    await unlink(tempFilePath);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      message: 'Excel file uploaded successfully',
      count: participantsData.length
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating Excel:', errorMessage);

    return NextResponse.json(
      { success: false, message: `Error generating Excel: ${errorMessage}` },
      { status: 500 }
    );
  }
}

