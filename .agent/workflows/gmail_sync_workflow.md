---
description: Users can sync their Gmail account to allow the AI Agent to analyze insurance policies.
---

# Gmail Sync Workflow for InsureOS Agent

This workflow describes how a user connects their Gmail account to the InsureOS Agent to enable automatic policy detection and premium analysis.

## Prerequisites
- A Google Cloud Project with the Gmail API enabled.
- OAuth Client ID and Secret configured in the backend (Convex).
- The user must trust the application (since it's in test mode, or verified).

## Steps

1.  **Initiate Sync Request**:
    - The user clicks the **"Sync Gmail"** button in the Agent Interface (`/agent`).
    - This triggers a request to the backend `auth:getGoogleAuthUrl` action.

2.  **Redirect to Google**:
    - The backend generates a Google OAuth URL requesting `https://www.googleapis.com/auth/gmail.readonly` scope.
    - The frontend redirects the user's browser to this URL.

3.  **User Authorization**:
    - The user logs in to their Google Account.
    - They grant permission for InsureOS to view their email messages.

4.  **Handle Callback**:
    - Google redirects the user back to the application callback URL (e.g., `https://insureos.app/auth/callback` or handled via popup).
    - The application sends the received `code` to the backend `auth:exchangeCode` action.

5.  **Token Exchange & Sync**:
    - The backend exchanges the `code` for an `access_token` and `refresh_token`.
    - It immediately triggers the `gmail:syncEmails` mutation.
    - This mutation:
        - Fetches the last 10-30 days of emails.
        - Filters for keywords like "Policy", "Premium", "Renewal", "Insurance".
        - Uses Gemini AI (`mcp:classifyEmail`) to confirm relevance.

6.  **Data Processing (Async)**:
    - **Step 6a**: New emails are stored in the Supabase `emails` table.
    - **Step 6b**: The `mcp:personaGenerator` action runs to update the user's risk profile and estimated premiums based on the new data.

7.  **User Notification**:
    - The frontend receives a real-time update (via Convex subscription) that the sync is complete.
    - The Agent Interface displays a message: *"I've analyzed your recent emails and found 3 active policies. Your estimated annual premium is $1,200."*

## Troubleshooting
- **"App not verified"**: Click "Advanced" -> "Go to InsureOS (unsafe)" during the Google consent screen if the app is in testing.
- **No emails found**: Ensure the emails contain standard insurance keywords and are within the sync window (default 30 days).
