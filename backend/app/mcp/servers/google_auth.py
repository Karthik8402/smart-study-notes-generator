"""
Google OAuth2 Authentication for MCP Servers

Provides shared OAuth2 authentication for Google Calendar and Drive APIs.
Supports per-user token storage and automatic token refresh.
"""

import os
from pathlib import Path
from typing import Optional, List
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


# OAuth Scopes for Calendar and Drive
CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
]

DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
]

ALL_SCOPES = CALENDAR_SCOPES + DRIVE_SCOPES

# Paths
BASE_DIR = Path(__file__).parent
CREDENTIALS_FILE = BASE_DIR / 'credentials.json'
TOKEN_DIR = Path('./uploads/google_tokens')


class GoogleAuthError(Exception):
    """Custom exception for Google authentication errors."""
    pass


def get_credentials_path() -> Path:
    """Get the path to credentials.json file."""
    if CREDENTIALS_FILE.exists():
        return CREDENTIALS_FILE
    
    # Also check environment variable
    env_path = os.getenv('GOOGLE_CREDENTIALS_PATH')
    if env_path and Path(env_path).exists():
        return Path(env_path)
    
    raise GoogleAuthError(
        f"credentials.json not found at {CREDENTIALS_FILE}. "
        "Please download OAuth credentials from Google Cloud Console "
        "and save them to this location."
    )


def get_token_path(user_id: str, service: str = "all") -> Path:
    """Get the path to store user's OAuth token."""
    TOKEN_DIR.mkdir(parents=True, exist_ok=True)
    return TOKEN_DIR / f'{user_id}_{service}_token.json'


def get_google_credentials(
    user_id: str,
    scopes: List[str] = None,
    service: str = "all"
) -> Credentials:
    """
    Get or refresh Google credentials for a user.
    
    Args:
        user_id: Unique identifier for the user
        scopes: OAuth scopes to request (defaults to ALL_SCOPES)
        service: Service identifier for token storage ('calendar', 'drive', or 'all')
    
    Returns:
        Valid Google Credentials object
    
    Raises:
        GoogleAuthError: If credentials.json is missing or OAuth fails
    """
    if scopes is None:
        scopes = ALL_SCOPES
    
    token_file = get_token_path(user_id, service)
    creds = None
    
    # Load existing credentials
    if token_file.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_file), scopes)
        except Exception as e:
            print(f"[GoogleAuth] Error loading token: {e}")
            creds = None
    
    # Refresh or get new credentials
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                print(f"[GoogleAuth] Token refreshed for user: {user_id}")
            except Exception as e:
                print(f"[GoogleAuth] Token refresh failed: {e}")
                creds = None
        
        if not creds:
            # Need new authorization
            credentials_path = get_credentials_path()
            flow = InstalledAppFlow.from_client_secrets_file(
                str(credentials_path), scopes
            )
            # Run local server for OAuth callback
            creds = flow.run_local_server(
                port=0,
                prompt='consent',
                success_message='Authentication successful! You can close this window.'
            )
            print(f"[GoogleAuth] New token obtained for user: {user_id}")
        
        # Save credentials
        token_file.write_text(creds.to_json())
    
    return creds


def get_calendar_service(user_id: str):
    """
    Get an authenticated Google Calendar API service.
    
    Args:
        user_id: Unique identifier for the user
    
    Returns:
        Google Calendar API service object
    """
    creds = get_google_credentials(user_id, CALENDAR_SCOPES, 'calendar')
    return build('calendar', 'v3', credentials=creds)


def get_drive_service(user_id: str):
    """
    Get an authenticated Google Drive API service.
    
    Args:
        user_id: Unique identifier for the user
    
    Returns:
        Google Drive API service object
    """
    creds = get_google_credentials(user_id, DRIVE_SCOPES, 'drive')
    return build('drive', 'v3', credentials=creds)


def check_auth_status(user_id: str, service: str = "all") -> dict:
    """
    Check if a user is authenticated with Google.
    
    Args:
        user_id: Unique identifier for the user
        service: Which service to check ('calendar', 'drive', or 'all')
    
    Returns:
        Dict with authentication status
    """
    token_file = get_token_path(user_id, service)
    
    if not token_file.exists():
        return {
            "authenticated": False,
            "message": "Not authenticated. Please connect your Google account."
        }
    
    try:
        scopes = ALL_SCOPES
        if service == 'calendar':
            scopes = CALENDAR_SCOPES
        elif service == 'drive':
            scopes = DRIVE_SCOPES
            
        creds = Credentials.from_authorized_user_file(str(token_file), scopes)
        
        if creds.valid:
            return {
                "authenticated": True,
                "message": "Google account connected",
                "expires": creds.expiry.isoformat() if creds.expiry else None
            }
        elif creds.expired and creds.refresh_token:
            return {
                "authenticated": True,
                "message": "Token expired but can be refreshed",
                "needs_refresh": True
            }
        else:
            return {
                "authenticated": False,
                "message": "Token invalid. Please re-authenticate."
            }
    except Exception as e:
        return {
            "authenticated": False,
            "message": f"Error checking auth: {str(e)}"
        }


def revoke_auth(user_id: str, service: str = "all") -> dict:
    """
    Revoke Google authentication for a user.
    
    Args:
        user_id: Unique identifier for the user
        service: Which service to revoke ('calendar', 'drive', or 'all')
    
    Returns:
        Dict with revocation status
    """
    token_file = get_token_path(user_id, service)
    
    if token_file.exists():
        token_file.unlink()
        return {
            "success": True,
            "message": f"Google {service} authentication revoked"
        }
    
    return {
        "success": False,
        "message": "No authentication found to revoke"
    }
