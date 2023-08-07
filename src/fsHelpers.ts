import { readTextFile as tauriReadTextFile, writeTextFile as tauriWriteTextFile } from '@tauri-apps/api/fs';

// Function to check if the file exists
export async function checkFileExists(filePath: string): Promise<boolean> {
    try {
        return await tauriExists(filePath);
    } catch (error) {
        console.error('Error checking file existence:', error);
        return false;
    }
}

export async function readTextFile(filePath: string): Promise<string> {
    try {
        return await tauriReadTextFile(filePath);
    } catch (error) {
        console.error('Error reading file:', error);
        throw error; // Rethrow the error to handle it at a higher level if needed
    }
}

export async function writeTextFile(filePath: string, data: string): Promise<void> {
    try {
        await tauriWriteTextFile(filePath, data);
    } catch (error) {
        console.error('Error writing file:', error);
        throw error; // Rethrow the error to handle it at a higher level if needed
    }
}
