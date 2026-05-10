# Medibook
# About Medibook

# How to run the project

# What was built




# Key technical/product decisions

- One of the first technical/product decisions was how to handle the different views for patients and physicians after login. To keep this clean, I decided to use role-based access, where each user has a role assigned to them in the database, either `patient` or `physician`. After login, the app checks the user’s role and shows the appropriate view.
Another question that came up was how the app would know whether a new user should be a patient or a physician. Since we do not want patients to be able to create physician accounts, public signups are assigned the `patient` role by default. Physician accounts are not created through the public signup flow. In a real system, they would be created or approved by an admin or clinic to prevent unauthorized access to the physician dashboard. For this demo, physician accounts are pre-created in the mock data.

  - The second technical/product decision was how to design the booking flow and where the main focus should be. I considered a few options, including a simple one-page flow where the patient chooses a physician, selects a time, and fills out their details all on the same page. I also considered a step-by-step wizard that guides the patient through each stage of the booking process.
I decided not to use those approaches because they made the booking flow feel like the only focus of the app. Instead, I wanted the patient to first land on a dashboard where they can see their existing appointments and their statuses. This feels closer to how a real patient-facing product would work, since patients would usually want to manage appointments, not only create new ones.
From the dashboard, patients can click “Book appointment” to enter a physician-first booking flow. This allows them to search available physicians, view a physician profile, choose an available time, and submit an appointment request.



  # Future Enhancements 
- Right now, the patient can only book from the available appointment slots shown for the upcoming week. With more time, I would make the booking flow more flexible by adding a fuller calendar view where patients can browse future dates.
