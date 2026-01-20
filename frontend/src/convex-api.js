// This is a manual definition of the Convex API structure
// to avoid importing backend code into the frontend bundle.

export const api = {
    mcp: {
        chat: {
            chat: "mcp/conversationSimulator:conversationSimulatorAction" // Correct internal function reference
        },
        persona: {
            generate: "mcp/personaGenerator:personaGenerator"
        },
        gmail: {
            sync: "gmail/sync:syncEmails"
        }
    },
    auth: {
        getGoogleAuthUrl: "auth/google:getGoogleAuthUrl"
    }
};
