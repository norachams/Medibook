# Medibook

A full-stack medical appointment booking platform designed to simplify the way patients and physicians manage healthcare appointments.

Patients can search for physicians, view available time slots, book appointments, and track their current bookings and view past appionemnts with doctor notes.

Physicians have access to a dashboard where they can view upcoming appointments, manage booking statuses by accepting or declining incoming appionment requests and access patient information related to each visit.


# How to Use Medibook

Medibook can be accessed either through the deployed web application or by running the project locally.

## Option 1: Use the Live App

You can try the deployed version of Medibook here:

[Live Demo](https://medibook-gray.vercel.app/login)


> **Note:** The backend is deployed on a free hosting service, so it may take a few seconds to a couple of minutes to wake up if it has been inactive. If the first request loads slowly, please give it a moment and try again.

### Demo Accounts

Use the following demo credentials to explore the app as either a patient or physician.

#### Patient Account

```txt
Email: patient@medbook.dev
Password: patient123
```

#### Physician Accounts
```txt
Email: sarah.chen@medbook.dev
Password: 123123
```
```txt
Email: james.okafor@medbook.dev
Password: 123123
```
```txt
Email: emily.wilson@medbook.dev
Password: 123123
```

## Option 2: Run Locally


### 1. Clone the repository

```bash
git clone <repository-url>
cd medibook 
```

### 2. Set up the backend

Navigate to the backend folder:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

For Windows:
```bash
venv\Scripts\activate
```

Install backend dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
python app.py 
```
The backend should run at:
```bash
http://localhost:8000
```

### 3. Set up the frontend

Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
```

Install frontend dependencies:
```bash
npm install
```

Run the frontend development server:
```bash
npm run dev
```

The frontend should run at:
```bash
http://localhost:5173
```

### 4. Open the app

Once both servers are running, open:
```bash
http://localhost:5173
```
---

# What Was Built

Medibook includes two main user experiences: a patient view for booking and managing appointments, and a physician view for reviewing requests, updating appointment statuses, and managing patient visits.

I also created a video walkthrough that shows the main features and user flows:

[Watch the Medibook Demo](https://youtu.be/gscCyfdw8OM)


### Patient View

The patient view is designed to help users manage their healthcare appointments from one place. Patients can create an account, complete their profile with medical information, book appointments, and track their visits over time.

Patients can:

- Create an account and log in
- Edit their profile and add medical information such as allergies, medications, conditions, and emergency contact details
- View their appointment dashboard
- Browse available physicians
- View physician profiles and available time slots
- Book appointments with available physicians
- Reschedule or cancel appointments
- Track appointment statuses
- View upcoming, past, and completed appointments
- View physician notes after an appointment is completed

### Physician View

The physician view is designed to support the appointment workflow from the provider’s side. Physicians can review booking requests, manage appointment statuses, and access relevant patient information before and after a visit.

Physicians can:

- Log in with a physician account
- View incoming booking requests
- Confirm, cancel, or complete appointments
- View patient details from a booking request
- Access patient profile information and medical history
- Add physician notes after an appointment
- Review past appointments and previous patients

---

# Key Technical and Product Decisions

### Role-based patient and physician views

One of the first decisions I had to make was how Medibook should handle two very different types of users: patients and physicians. Both users log into the same app, but they should not see or access the same information.

To keep this clean, I added role-based access. Each user has a role stored in the database, either `patient` or `physician`, and after login, the app uses that role to send them to the correct dashboard. Patients can view and manage their appointments, while physicians can view booking requests, access patient details, and update appointment statuses.

I also had to think about how new accounts should be created. Since patients should not be able to sign up as physicians on their own, all public signups are assigned the `patient` role by default. For this demo, physician accounts are pre-created in the mock data, but in a real system, they would be created or approved by an admin or clinic.

### Physician dashboard design

When building the physician side, I did not want it to feel like a simple list of booking requests. In a real healthcare workflow, physicians usually need more context than just a patient name and appointment time.

Because of that, I designed the physician dashboard to support the full appointment workflow. Physicians can review incoming requests, view patient information, update appointment statuses, and look back at past appointments. This makes the dashboard feel more useful beyond just accepting or rejecting bookings.

### Patient-first booking flow

Another decision I spent time thinking about was the booking flow. At first, I considered making it a simple form where patients choose a doctor, pick a time, and submit their details all on one page. I also considered a step-by-step flow that walks the patient through the process.

I decided not to make booking the first thing users see. Instead, I wanted patients to land on a dashboard where they can see their current appointments and statuses first. This felt more realistic because a healthcare booking app should help patients manage their appointments, not only create new ones.

From the dashboard, patients can choose to book a new appointment. The flow then becomes physician-first: they can search for a doctor, view the physician’s profile, choose an available time slot, and submit an appointment request.

### Appointment history and visit details

I also wanted the app to include small details that make it feel closer to a real healthcare product. Once an appointment is completed, patients can view the appointment again and see physician notes when available.

On the physician side, doctors can view past patients and past appointments, which makes the experience feel less temporary. Instead of each booking disappearing after it is handled, both patients and physicians have a record of previous visits and important appointment details.

---
## Future Enhancements

- **Account verification and onboarding**  
  Add a more complete account creation flow, including email verification, password reset, and a more detailed onboarding process for patients and physicians.

- **Advanced physician search and filters**  
  Add filters for specialty, location, availability, language, ratings, and appointment type to help patients find the right physician more easily.

- **Expanded booking calendar**  
  Allow patients to browse future appointment availability through a full calendar view instead of only seeing slots for the upcoming week.

- **Appointment notifications and reminders**  
  Send email, SMS, or in-app notifications when appointments are booked, confirmed, cancelled, rescheduled, or coming up soon.

- **Secure file uploads**  
  Let patients upload documents such as referral forms, lab results, or insurance information before appointments.

- **Improved rescheduling flow**  
  Make rescheduling smoother by allowing patients and physicians to suggest new times and automatically update appointment statuses.

- **Improve backend validation and error handling**  
  Add more robust validation for appointment creation, user input, unavailable slots, duplicate bookings, and booking conflicts.

- **Add automated testing**  
  Implement unit and integration tests for key flows such as authentication, booking appointments, updating appointment statuses, editing profiles, and viewing patient details.

- **Production security improvements**  
  Add stronger authorization checks, audit logs, rate limiting, and stricter handling of sensitive patient information before using the app with real data.

