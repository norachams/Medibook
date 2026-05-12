# Medibook
# About Medibook

Medibook is a full-stack medical appointment booking platform designed to simplify the way patients and physicians manage healthcare appointments.

Patients can search for physicians, view available time slots, book appointments, and track their current bookings and view past appionemnts with doctor notes.

Physicians have access to a dashboard where they can view upcoming appointments, manage booking statuses by accepting or declining incoming appionment requests and access patient information related to each visit.


# How to Use Medibook

Medibook can be accessed either through the deployed web application or by running the project locally.

## Option 1: Use the Live App

You can try the deployed version of Medibook here:

[Live Demo]()

From the app, users can:

- Sign up or log in as a patient or physician
- Browse available physicians
- View appointment slots
- Book medical appointments
- Track upcoming and past bookings
- Access physician dashboards for managing appointments and patient details

To run Medibook locally, follow the steps below.

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


# What was built




# Key technical/product decisions

- One of the first technical/product decisions was how to handle the different views for patients and physicians after login. To keep this clean, I decided to use role-based access, where each user has a role assigned to them in the database, either `patient` or `physician`. After login, the app checks the user’s role and shows the appropriate view.
Another question that came up was how the app would know whether a new user should be a patient or a physician. Since we do not want patients to be able to create physician accounts, public signups are assigned the `patient` role by default. Physician accounts are not created through the public signup flow. In a real system, they would be created or approved by an admin or clinic to prevent unauthorized access to the physician dashboard. For this demo, physician accounts are pre-created in the mock data.

  - The second technical/product decision was how to design the booking flow and where the main focus should be. I considered a few options, including a simple one-page flow where the patient chooses a physician, selects a time, and fills out their details all on the same page. I also considered a step-by-step wizard that guides the patient through each stage of the booking process.
I decided not to use those approaches because they made the booking flow feel like the only focus of the app. Instead, I wanted the patient to first land on a dashboard where they can see their existing appointments and their statuses. This feels closer to how a real patient-facing product would work, since patients would usually want to manage appointments, not only create new ones.
From the dashboard, patients can click “Book appointment” to enter a physician-first booking flow. This allows them to search available physicians, view a physician profile, choose an available time, and submit an appointment request.



  # Future Enhancements 
- Right now, the patient can only book from the available appointment slots shown for the upcoming week. With more time, I would make the booking flow more flexible by adding a fuller calendar view where patients can browse future dates.
