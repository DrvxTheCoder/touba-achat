import { customAlphabet } from 'nanoid';

// Define a custom alphabet for the random part (excluding similar-looking characters)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 4);

export default function generateEDBId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = `${year}${month}${day}`;
  
  // Generate a random string
  const randomPart = nanoid();

  return `EDB-${timestamp}${randomPart}`;
}
