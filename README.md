# HealthSync — Patient-Doc

## ✅ Complete File Map

```
src/
  app/
    page.tsx                    ← Auth (login + register)
    patient/
      layout.tsx                ← Header, footer, logout
      home/page.tsx             ← Dashboard: appointments + activity feed
      book/page.tsx             ← Book appointment (runTransaction)
      messages/page.tsx         ← Real-time chat
      records/page.tsx          ← Health records (prescriptions/labs/visits)
    doctor/
      layout.tsx
      page.tsx                  ← Redirects to /doctor/queue
      queue/page.tsx            ← Patient queue + SOAP notes
      messages/page.tsx         ← Doctor chat
      schedule/page.tsx         ← Slot generator (writeBatch)

  hooks/
    useAuth.ts                  ← onAuthStateChanged → Zustand store
    useAppointments.ts          ← onSnapshot (role-based)
    useMessages.ts              ← paginated onSnapshot + sendMessage
    usePatientRecords.ts        ← multi-collection onSnapshot

  services/firebase/
    config.ts                   ← initializeApp, db, auth, storage
    auth.ts                     ← loginUser, registerUser, logoutUser
    messages.ts                 ← sendMessage, createThread
    appointments.ts             ← bookSlot (runTransaction), updateStatus
    records.ts                  ← addRecord, generateDoctorSlots

  components/
    ErrorBoundary.tsx           ← React error boundary

  store/
    index.ts                    ← Zustand: user, role, profile cache
```

---

## 🚀 Deploy Steps

### 1. Fill in Firebase credentials

```bash
cp .env.local.example .env.local
# Open .env.local and paste your Firebase project values
```

### 2. Install and run

```bash
npm install
npm run dev       # development
npm run build     # production build
```

### 3. Deploy Firestore rules + indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
# Set all NEXT_PUBLIC_FIREBASE_* env vars in Vercel dashboard
```

---

## 🔥 Test Flow (in order)

1. **Register** as a Doctor → fills in `doctors/{uid}` + sets role
2. **Go to Schedule** → click "Auto Generate Shift" to create available slots
3. **Register** as a Patient (different browser/incognito)
4. **Book an Appointment** → select the doctor, date, slot → confirm
5. **Doctor Queue** → see patient appear in real-time → fill SOAP → Finalize
6. **Patient Messages** → start a new chat → send a message
7. **Doctor Messages** → reply → both sides update in real time
8. **Patient Records** → visit created by SOAP finalization appears here

---

## ⚠️ Important

- The `design/*.html` files are **read-only UI references only**. The actual app is in `src/`.
- All lint errors in VS Code before `npm install` are expected — packages aren't downloaded yet.
- Set `NEXT_PUBLIC_APP_ENV=production` in Vercel for production deployments.
