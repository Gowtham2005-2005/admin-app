import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { db } from '@/firebase'; // Update with your Firebase import
import { collection, getDocs } from 'firebase/firestore';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to generate Excel buffer
function generateExcel(data: Record<string, unknown>[]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

// Function to clear existing file in Cloudinary
async function clearExistingExcelFile() {
  try {
    await cloudinary.uploader.destroy('tedx-certificates/excel/participants', { resource_type: 'raw' });
    console.log('Cleared existing Excel file');
  } catch (error) {
    console.log('No existing Excel file found or error clearing:', error);
  }
}

// Function to fetch participants data from Firebase
async function fetchParticipantsFromFirebase() {
  try {
    const participantsCollection = collection(db, 'participants');
    const snapshot = await getDocs(participantsCollection);
    
    const participants = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });
    
    return participants;
  } catch (error) {
    console.error('Error fetching participants from Firebase:', error);
    throw error;
  }
}

// GET handler to generate and upload Excel file
export async function GET(req: Request) {
  try {
    console.log('Processing request to generate Excel from Firebase...');

    // Verify Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary configuration');
    }

    // Fetch participants data from Firebase
    const participantsData = await fetchParticipantsFromFirebase();
    
    if (!participantsData || participantsData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No participants data found'
      });
    }

    // Generate Excel buffer
    const excelBuffer = generateExcel(participantsData);

    // Save buffer to a proper temp directory
    const tempDir = os.tmpdir(); // Get OS-specific temp directory
    const tempFilePath = path.join(tempDir, 'participants.xlsx');
    await writeFile(tempFilePath, excelBuffer);

    // Clear existing file before upload
    await clearExistingExcelFile();

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'tedx-certificates/excel',
      public_id: 'participants',
      resource_type: 'raw',
      format: 'xlsx',
      overwrite: true,
      use_filename: true,
      unique_filename: false
    });

    // Remove the temporary file
    await unlink(tempFilePath);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      message: 'Excel file generated successfully',
      count: participantsData.length
    });

  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json({
      success: false,
      message: 'Error generating Excel file'
    });
  }
}