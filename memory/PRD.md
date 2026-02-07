# Digital Mate - Product Requirements Document

## Original Problem Statement
Build "Digital Mate" (formerly Aegis) - a Hierarchical Proactive Intelligence (HPI) based "Life OS" application focused on proactive smartphone security.

### Core Value Proposition
"Your phone's bodyguard" - We don't just lock attackers out. We let them IN to fake data while capturing their photo and location.

## User Personas
1. **Privacy-Conscious Individual** - Wants to protect personal data from snooping partners, coworkers, or thieves
2. **Domestic Violence Survivor** - Needs evidence collection and duress features for dangerous situations
3. **Business Professional** - Requires secure storage for sensitive corporate data
4. **Parent** - Wants to keep certain content private from children accessing their phone

## Implemented Features (Stage 1 MVP)

### ✅ Core Security Features
- **Pattern Lock System** - Multiple pattern types (Owner, Duress, Wrong)
- **Trap Mode™** - Shows fake data to intruders while gathering evidence
- **Intruder Photo Capture** - Silent camera capture on wrong pattern attempts
- **Invisible Vault** - Hidden vault accessed by dialing 8675309 in Phone app
- **Duress Pattern** - Special pattern (2-5-8) shows fake data + silent alert
- **Behavioral Guard™** - Detects unusual usage patterns

### ✅ Dual App Modes
- **Demo Mode** - Full-featured investor showcase
- **User Mode** - Simplified public release version
- Managed via `AppModeContext.js`

### ✅ Interactive Demo
- Fully interactive previews with modals
- "View Photo" buttons show actual mock content
- Complete investor walkthrough available

### ✅ Digital Mate Website
- Multi-page marketing site (Home, Features, Pricing, Investors, About, Contact)
- Investor page with pitch materials and auto-reply system
- Pricing: Basic ($4.99/mo), Pro ($9.99/mo)

### ✅ Android App Conversion
- Capacitor setup complete
- Native Android project at `/app/frontend/android/`
- Build guide at `/app/ANDROID_BUILD_GUIDE.md`

### ✅ Investor Package
- `/app/DIGITAL_MATE_INVESTOR_PACKAGE.md` - Vision & pitch
- `/app/DIGITAL_MATE_FINANCIAL_MODEL.md` - Financial projections
- `/app/HOW_TO_MAKE_MONEY.md` - Monetization strategy

## Pricing Model (Updated Dec 2025)
| Tier | Price | Features |
|------|-------|----------|
| Basic | $4.99/mo | Pattern lock, Invisible Vault, Intruder photos, GPS, Remote lock, 3 contacts |
| Pro | $9.99/mo | Everything in Basic + Trap Mode™, Duress pattern, Behavioral Guard™, Remote wipe, Unlimited contacts, AI features, Priority support |
| Enterprise | Custom | Business/fleet pricing |

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Mobile**: Capacitor (Android wrapper)
- **AI**: Emergent LLM Key integration

## Key Credentials
- **Owner Pattern**: 1-5-9-8-7 (full access)
- **Duress Pattern**: 2-5-8 (fake data + silent alert)
- **Invisible Vault Code**: 8675309 (dial in Phone app)

## Code Architecture
```
/app/
├── backend/server.py
├── frontend/
│   ├── android/                  # Capacitor Android project
│   ├── src/
│   │   ├── App.js               # Main app + mode management
│   │   ├── components/
│   │   │   ├── AegisInvisibleMode.js
│   │   │   ├── ContextualHub.js
│   │   │   ├── DigitalMateWebsite.js
│   │   │   ├── InteractivePreviews.js
│   │   │   ├── PhoneDialer.js
│   │   │   └── UserModeHome.js
│   │   └── contexts/AppModeContext.js
│   └── capacitor.config.json
├── ANDROID_BUILD_GUIDE.md
├── DIGITAL_MATE_INVESTOR_PACKAGE.md
├── DIGITAL_MATE_FINANCIAL_MODEL.md
└── HOW_TO_MAKE_MONEY.md
```

## Roadmap

### P1 - Next (Upcoming)
- [x] Hide Demo Mode toggle from public User Mode UI ✅ (Dec 2025)
- [ ] Build and test final APK locally
- [ ] Submit to Google Play Store

**Secret Demo Mode Access:** Tap "Digital Mate" title 7 times in User Mode to unlock Demo Mode

### P2 - Soon
- [ ] Hidden Message/Email Organizer
- [ ] Voice Commands (OpenAI Whisper integration)

### P3 - Future
- [ ] Build remaining wireframed screens from Aegis vision
- [ ] iOS version via Capacitor
- [ ] Push notification system
- [ ] Annual subscription options

## Known Issues
- Testing agent has intermittent frontend loading issues (use screenshot tool as workaround)

## Project Status
- **Phase**: Stage 1 MVP (Pre-launch)
- **Build Status**: Ready for Android compilation
- **Last Updated**: December 2025
