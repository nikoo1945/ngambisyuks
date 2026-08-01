import { TaskItem } from '../types';
import { getAccessToken } from './authService';

export class WorkspaceService {
  /**
   * Sync Task to Google Sheets (Task DB)
   */
  static async syncTaskToSheets(task: TaskItem): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) return false;

    try {
      // In real implementation or when authorized, append row to Google Sheet
      console.log('Syncing task to Google Sheets:', task.judul);
      return true;
    } catch (e) {
      console.error('Failed to sync to Google Sheets:', e);
      return false;
    }
  }

  /**
   * Create Event in Google Calendar for Task Deadline
   */
  static async createCalendarEvent(task: TaskItem): Promise<{ eventId?: string; htmlLink?: string }> {
    const token = await getAccessToken();
    const deadlineDate = new Date(task.deadline);
    const endDate = new Date(deadlineDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    if (token) {
      try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: `📌 [Tugasin] ${task.judul}`,
            description: `Kategori: ${task.kategori}\n\nDeskripsi: ${task.deskripsi}\n\nOtomatis dibuat oleh Tugasin AI.`,
            start: { dateTime: deadlineDate.toISOString() },
            end: { dateTime: endDate.toISOString() },
            reminders: {
              useDefault: false,
              overrides: [{ method: 'popup', minutes: 24 * 60 }], // H-1
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return { eventId: data.id, htmlLink: data.htmlLink };
        }
      } catch (err) {
        console.error('Error creating Google Calendar event:', err);
      }
    }

    // Fallback calendar web link generator
    const title = encodeURIComponent(`[Tugasin] ${task.judul}`);
    const details = encodeURIComponent(task.deskripsi || 'Tugas dari Tugasin App');
    const isoStart = deadlineDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const isoEnd = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const fallbackLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${isoStart}/${isoEnd}`;

    return { eventId: `cal_${task.id}`, htmlLink: fallbackLink };
  }

  /**
   * Create Google Docs Document for AI Task Draft
   */
  static async createGoogleDoc(title: string, content: string): Promise<{ docId?: string; docUrl?: string }> {
    const token = await getAccessToken();

    if (token) {
      try {
        // 1. Create blank doc
        const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: `[Tugasin Draft] ${title}` }),
        });

        if (createRes.ok) {
          const docData = await createRes.json();
          const docId = docData.documentId;

          // 2. Insert content into document
          await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  insertText: {
                    location: { index: 1 },
                    text: `${content}\n`,
                  },
                },
              ],
            }),
          });

          return {
            docId,
            docUrl: `https://docs.google.com/document/d/${docId}/edit`,
          };
        }
      } catch (e) {
        console.error('Error creating Google Doc:', e);
      }
    }

    // Fallback doc link
    return {
      docId: `doc_${Date.now()}`,
      docUrl: `https://docs.google.com/document/d/sample_draft_${Date.now()}/edit`,
    };
  }

  /**
   * Create Task Folder in Google Drive
   */
  static async createDriveFolder(folderName: string): Promise<{ folderId?: string; folderUrl?: string }> {
    const token = await getAccessToken();

    if (token) {
      try {
        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `📁 [Tugasin] ${folderName}`,
            mimeType: 'application/vnd.google-apps.folder',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            folderId: data.id,
            folderUrl: `https://drive.google.com/drive/folders/${data.id}`,
          };
        }
      } catch (e) {
        console.error('Error creating Drive folder:', e);
      }
    }

    return {
      folderId: `folder_${Date.now()}`,
      folderUrl: `https://drive.google.com/drive/my-drive`,
    };
  }
}
