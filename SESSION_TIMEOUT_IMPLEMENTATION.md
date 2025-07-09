# Session Timeout Implementation

## Overview
Implemented automatic session expiration with 2-hour timeout and automatic logout functionality. Users are automatically logged out after 2 hours from login OR 30 minutes of inactivity, whichever comes first.

## Features Implemented

### ✅ Session Management
- **2-Hour Maximum Session**: Sessions automatically expire 2 hours after login
- **30-Minute Inactivity Timeout**: Sessions expire after 30 minutes of no user activity
- **Activity Tracking**: Mouse movements, clicks, keyboard input, and scrolling reset the inactivity timer
- **Persistent Sessions**: Sessions survive browser/app restarts using localStorage
- **Session Validation**: Automatic validation on app startup

### ✅ User Interface
- **Session Timer Display**: Real-time countdown in the header showing remaining session time
- **Color-Coded Status**: Green (>10 min), Yellow (5-10 min), Red (<5 min)
- **Session Warning**: Yellow banner appears when 5 minutes or less remaining
- **Extend Session Button**: Users can extend their session with one click
- **Automatic Logout**: Seamless redirect to login when session expires

### ✅ Security Features
- **Secure Session Storage**: Session data stored with timestamps in localStorage
- **Database Validation**: User existence verified on session restoration
- **Automatic Cleanup**: Expired sessions automatically removed from storage
- **Activity Monitoring**: Real-time monitoring with 1-minute intervals

## Technical Implementation

### Session Data Structure
```typescript
interface AuthSession {
  user: User
  loginTime: number      // Timestamp when user logged in
  lastActivity: number   // Timestamp of last user activity
}
```

### Timeout Configuration
```typescript
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000      // 2 hours
const INACTIVITY_TIMEOUT = 30 * 60 * 1000       // 30 minutes
const SESSION_WARNING_TIME = 5 * 60 * 1000      // 5 minutes warning
```

### Activity Tracking Events
- `mousedown` - Mouse button press
- `mousemove` - Mouse movement
- `keypress` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch screen interaction
- `click` - Mouse clicks

## How It Works

### 1. Login Process
1. User enters credentials and logs in
2. System creates session with current timestamp for both `loginTime` and `lastActivity`
3. Session stored in localStorage as `authSession`
4. User redirected to dashboard

### 2. Session Monitoring
1. **Real-time Monitoring**: Every minute, system checks session status
2. **Expiration Check**: Compares current time against both timeout conditions
3. **Time Calculation**: Calculates remaining time until expiration
4. **UI Updates**: Updates session timer display and warning states

### 3. Activity Tracking
1. **Event Listeners**: Monitors user interaction events
2. **Activity Update**: Updates `lastActivity` timestamp on any user action
3. **Inactivity Reset**: Resets the 30-minute inactivity countdown

### 4. Session Expiration
1. **Automatic Detection**: System detects expired sessions during monitoring
2. **Immediate Logout**: Automatically logs user out and clears session data
3. **Redirect**: Redirects to login page with clean state

### 5. Session Extension
1. **Manual Extension**: User clicks "Extend Session" button
2. **Activity Reset**: Updates `lastActivity` to current time
3. **Timer Reset**: Resets inactivity countdown to 30 minutes

## User Experience

### Session Status Display
- **Header Timer**: Shows remaining session time (e.g., "1:25:30" or "25:30")
- **Color Indicators**:
  - 🟢 Green: More than 10 minutes remaining
  - 🟡 Yellow: 5-10 minutes remaining  
  - 🔴 Red: Less than 5 minutes remaining

### Warning System
- **5-Minute Warning**: Yellow banner appears at top of screen
- **Warning Message**: "Your session will expire in X:XX. Extend your session or you'll be automatically logged out."
- **Action Buttons**: "Extend Session" and "Logout Now"
- **Dismissible**: Users can dismiss the warning (but timer continues)

### Automatic Logout
- **Seamless Transition**: No error messages, just redirect to login
- **Clean State**: All session data cleared from localStorage
- **Fresh Start**: User can immediately log in again

## Testing

### Manual Testing
1. **Login**: Log in with any test credentials
2. **Timer Display**: Verify session timer appears in header
3. **Activity Test**: Move mouse/click and verify timer updates
4. **Warning Test**: Wait for warning to appear (or modify timeout for testing)
5. **Extension Test**: Click "Extend Session" and verify timer resets
6. **Logout Test**: Wait for automatic logout or click "Logout Now"

### Automated Testing
Run the test script to verify timeout logic:
```bash
node test-session-timeout.js
```

## Configuration

### Adjusting Timeouts
To modify session timeouts, edit the constants in `AuthContext.tsx`:

```typescript
// Current settings
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000      // 2 hours
const INACTIVITY_TIMEOUT = 30 * 60 * 1000       // 30 minutes
const SESSION_WARNING_TIME = 5 * 60 * 1000      // 5 minutes

// Example: 1 hour session, 15 minutes inactivity
const SESSION_TIMEOUT = 1 * 60 * 60 * 1000      // 1 hour
const INACTIVITY_TIMEOUT = 15 * 60 * 1000       // 15 minutes
const SESSION_WARNING_TIME = 2 * 60 * 1000      // 2 minutes warning
```

### Monitoring Frequency
Session monitoring runs every 60 seconds. To change frequency:

```typescript
// Current: Check every minute
}, 60000) // Check every minute

// Example: Check every 30 seconds
}, 30000) // Check every 30 seconds
```

## Files Modified

### Core Implementation
- `src/renderer/contexts/AuthContext.tsx` - Main session management logic
- `src/renderer/components/AuthenticatedLayout.tsx` - Session timer display
- `src/renderer/components/SessionTimeoutWarning.tsx` - Warning banner

### Test Files
- `test-session-timeout.js` - Session timeout logic testing

## Security Considerations

### ✅ Implemented
- Session data stored locally (not in cookies)
- Automatic cleanup of expired sessions
- Database validation on session restoration
- Secure logout with complete data cleanup

### 🔄 Future Enhancements
- Server-side session validation
- JWT tokens instead of localStorage
- Session encryption
- Audit logging for security events
- Rate limiting for login attempts

## Troubleshooting

### Common Issues
1. **Timer not updating**: Check if activity tracking events are firing
2. **Session not expiring**: Verify timeout constants are correct
3. **Warning not showing**: Check if `SessionTimeoutWarning` component is rendered
4. **Logout not working**: Verify `logout()` function clears all session data

### Debug Information
The system logs session events to the console:
- "User logged in successfully, session created"
- "Session refreshed"
- "Session will expire in X minutes"
- "Session expired during monitoring, logging out"
- "User logged out"

## Summary

The session timeout system provides a secure and user-friendly way to manage authentication sessions with:

- ⏰ **Automatic expiration** after 2 hours or 30 minutes of inactivity
- 🔄 **Real-time monitoring** with visual feedback
- ⚠️ **Early warning system** with 5-minute advance notice
- 🔧 **Easy extension** with one-click session refresh
- 🔒 **Secure cleanup** with automatic logout and data clearing

Users can work uninterrupted while the system maintains security through automatic session management.
