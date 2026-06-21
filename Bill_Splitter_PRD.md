# Product Requirements Document (PRD)
# Bill Splitter App

**Version:** 1.0
**Date:** June 2026
**Status:** Ready for Development

---

## SECTION 1: EXECUTIVE SUMMARY

### What is the App?

Bill Splitter is a web application that helps people track their personal spending and split shared expenses with friends and groups. Whether you are on a trip with friends, sharing a flat, or going out for dinner — Bill Splitter makes it easy to know who paid what and who owes who.

You can use it for two things:

1. **Personal Expenses** — Track your own spending (like a simple money diary).
2. **Group Expenses** — Add friends to a group, log shared costs, and see a clear breakdown of who owes who.

### What Problem Does It Solve?

Splitting bills with friends is messy. People forget who paid, arguments happen over small amounts, and nobody wants to do the math. Common problems include:

- Forgetting who paid for dinner last week.
- Not knowing if you still owe your flat mate for the electricity bill.
- Losing track of trip expenses across WhatsApp messages and notes apps.
- Having no single place where everyone can see the shared spending.

Bill Splitter solves all of this. Every expense is recorded, every member can see the totals, and the app does the math automatically.

### What Technology Stack is Used?

| Layer | Technology | Purpose |
|---|---|---|
| Frontend (what you see) | React + Next.js | Builds the screens and pages users interact with |
| Styling (how it looks) | Tailwind CSS | Makes the app look clean and work on all screen sizes |
| Backend & Database | Supabase | Stores all data and handles user login |
| Authentication | Supabase Auth | Manages sign up, login, and keeping users logged in |
| Hosting | Vercel | Puts the app online and auto-updates when code changes |

### Are All Features Real or Simulated?

**All features are real and fully functional.** This is not a demo or a mock-up. Every button does something. Every form saves real data. Every number you see comes from the actual database.

---

## SECTION 2: USER PERSONAS

### Persona 1 — Riya, the Weekend Traveller

**Name:** Riya Sharma
**Age:** 26
**Location:** Bengaluru, India

**What is her life like?**
Riya works as a graphic designer at a mid-sized company. She earns a decent salary but tries to save money wherever she can. Every two to three months, she goes on short trips with her college friend group of five people. These trips involve booking stays, sharing meals, paying for cabs, and splitting fuel costs. Riya is usually the one who ends up paying first because she has a credit card, and the others promise to pay her back later.

**What is her problem?**
After every trip, Riya has to send individual messages to four different friends asking them to pay her back. She forgets small amounts, her friends conveniently forget others, and by the end of the month she has no idea whether she got her full money back. She has tried using notes apps and WhatsApp polls but nothing sticks.

**What is her goal with the app?**
Riya wants one place where the whole group can see every trip expense. She wants to add an expense like "Hotel in Goa — ₹4,800, paid by Riya" and have the app automatically calculate what each person owes her. She wants her friends to be able to log in and see it too — so there are no disputes.

---

### Persona 2 — Arjun, the Flat Mate

**Name:** Arjun Mehta
**Age:** 29
**Location:** Mumbai, India

**What is his life like?**
Arjun shares a 2BHK flat with two other working professionals. Every month, one of the three pays for electricity, another pays for groceries, and the third pays for internet. They have an informal rotation but it is hard to remember whose turn it is. Beyond rent, there are random shared costs like cleaning supplies, gas cylinder refills, and the occasional shared meal delivery.

**What is his problem?**
Arjun and his flat mates keep track of expenses in a shared WhatsApp group, but the messages get buried. At the end of the month, nobody is sure of the exact amounts. Small disagreements happen. Sometimes one person quietly overpays for weeks before someone notices.

**What is his goal with the app?**
Arjun wants a "Flat Mates" group inside the app where all three flat mates are added. Whenever someone pays a shared bill, they log it in the app. At any point, Arjun can open the app and see who is owed money and who needs to pay up. He also wants to track his own personal spending on the side so he knows where his salary goes.

---

## SECTION 3: CORE FEATURES

### Feature 1 — User Sign Up and Login

Users create an account using their name, email address, and a password. Once registered, they can log in from any device. Passwords are stored securely — never in plain text. If someone tries to log in with the wrong password, they see a clear error message.

**What this enables:**
- Each person has their own private account.
- No two people share the same data unless they are in the same group.
- The app remembers who you are even after you close the browser.

---

### Feature 2 — Add Personal Expenses

Any logged-in user can add their own private expenses. Each expense has three fields:

- **Description** — What was this money spent on? (e.g., "Coffee at airport")
- **Amount** — How much was spent? (e.g., ₹350)
- **Category** — What type of expense? (e.g., Food, Travel, Utilities, Entertainment, Shopping, Other)

Personal expenses are only visible to the person who added them. Nobody else can see them.

---

### Feature 3 — See Your Spending Stats

On the personal expenses page, users see a set of summary cards at the top that show:

- **Total Spent (All Time)** — Every rupee logged since they joined.
- **Total Spent This Month** — How much they have spent in the current calendar month.
- **Number of Transactions** — How many expense entries they have made.
- **Average Per Transaction** — Total amount divided by number of entries.

These numbers update automatically every time a new expense is added or deleted.

---

### Feature 4 — Create Groups

Any user can create a group. A group is a shared space for tracking expenses between multiple people. Examples:

- "Goa Trip 2026"
- "Flat Mates — Andheri"
- "Office Lunch Gang"

When creating a group, the user gives it a name. They become the group's creator automatically. Creators can delete the group later.

---

### Feature 5 — Add Friends to Groups

After creating a group, the creator can add other users by entering their email address. The app looks up the email in the system. If the email belongs to a registered user, that person is added as a group member.

- A user can be a member of many groups.
- Added members can see the group, its expenses, and its balance summary.
- Only the group creator can add or remove members.

---

### Feature 6 — Add Group Expenses

Any member of a group can log a shared expense. Each group expense includes:

- **Who paid** — The person who actually paid the bill (selected from group members).
- **Amount** — How much was paid.
- **Description** — What was it for? (e.g., "Dinner at beach shack")
- **Date** — When did this happen?

The expense is visible to all members of the group. The app uses this information to calculate balances.

---

### Feature 7 — See Who Owes Who

On the group page, users see a balance breakdown:

- How much each person in the group has paid in total.
- Each person's equal share (total expenses ÷ number of members).
- Whether each person has **paid more than their share** (they are owed money) or **paid less than their share** (they owe money).
- The exact amount each person owes or is owed.

This section updates live as new expenses are added.

**Example:**
Group: Goa Trip — 3 members — Total Expenses: ₹9,000
- Riya paid: ₹6,000 → She is owed ₹3,000
- Priya paid: ₹3,000 → She is settled
- Neha paid: ₹0 → She owes ₹3,000

---

### Feature 8 — Delete Things You Created

Users have the ability to delete:

- Their own personal expenses (only their own, not anyone else's).
- Groups they created (this also deletes all expenses in that group).

Before deleting a group, the app shows a warning that says: "Deleting this group will also delete all expenses inside it. This cannot be undone." The user must confirm before anything is deleted.

---

### Feature 9 — See Only Your Own Data (Privacy)

The app enforces strict privacy:

- Personal expenses are only visible to the person who created them.
- Group data is only visible to members of that group.
- No user can access another user's personal expenses, even by accident.
- These rules are enforced at the database level — not just by the website's code. Even if someone tries to bypass the website, the database will reject unauthorized requests.

---

### Feature 10 — Stay Logged In When You Refresh the Page

Users do not need to log in again every time they refresh the page. The app remembers the logged-in session using a secure token stored in the browser. This session stays active until the user clicks "Log Out" or the session expires naturally.

---

### Feature 11 — A Working Sidebar That Does Not Reload

The app has a sidebar on the left (on desktop) with navigation links:

- Dashboard
- My Expenses
- My Groups

Clicking any link in the sidebar changes the page content on the right side **without reloading the whole browser page**. This makes the app feel fast and smooth — like a proper app, not a slow website.

---

## SECTION 4: USER FLOWS

### Flow 1 — How Someone Signs Up

1. User visits the app's homepage or goes to `/signup`.
2. They see a sign-up form with three fields: **Full Name**, **Email Address**, **Password**, and **Confirm Password**.
3. They fill in all fields and click **"Create Account"**.
4. The app checks:
   - Is the email address in a valid format? (e.g., must have @ and a domain)
   - Are the two password fields matching?
   - Is the password at least 8 characters long?
   - Is this email already registered?
5. If everything is fine: the account is created. The user is automatically logged in and sent to `/dashboard`.
6. A success message appears: **"Welcome to Bill Splitter! Your account has been created."**

---

### Flow 2 — How Someone Logs In

1. User goes to `/login`.
2. They see a login form with two fields: **Email Address** and **Password**.
3. They fill in their details and click **"Sign In"**.
4. The app checks the email and password against the database.
5. If correct: user is sent to `/dashboard`.
6. If wrong: an error message appears below the form saying **"Incorrect email or password. Please try again."**
7. The login button is disabled while the check is happening (shows "Signing in..." text) to prevent double-clicking.

---

### Flow 3 — How Someone Adds a Personal Expense

1. User is logged in and goes to `/dashboard/expenses`.
2. They see a form at the top of the page with three fields: **Description**, **Amount**, and **Category** (a dropdown).
3. They fill in the fields. Example: Description = "Uber to airport", Amount = "480", Category = "Travel".
4. They click **"Add Expense"**.
5. The app saves the expense to the database linked to their user account.
6. The expense appears instantly in the list below the form.
7. The stats cards at the top of the page update to reflect the new total.
8. A success message appears briefly: **"Expense added successfully."**

---

### Flow 4 — How Someone Creates a Group and Adds a Friend

**Step A: Create the Group**
1. User goes to `/dashboard/groups`.
2. They see a "Create New Group" form with one field: **Group Name**.
3. They type a name (e.g., "Goa Trip 2026") and click **"Create Group"**.
4. The group is saved and appears immediately in their group list.
5. Success message: **"Group created! Now add your friends."**

**Step B: Add a Friend**
1. User clicks on the group name to open it.
2. Inside the group, they see an "Add Member" section with an email input field.
3. They type their friend's email address and click **"Add"**.
4. The app checks if that email belongs to a registered user.
5. If yes: the friend is added to the group. Their name appears in the members list.
6. If no: an error message shows: **"No user found with that email address. Ask them to sign up first."**

---

### Flow 5 — What Happens If Someone Does Something Wrong (Error Messages)

| Situation | Error Message Shown |
|---|---|
| Tries to sign up with an already-used email | "This email is already registered. Please log in instead." |
| Leaves the amount field blank when adding an expense | "Please enter an amount." |
| Types letters instead of numbers in the amount field | "Amount must be a number." |
| Enters a negative amount | "Amount must be greater than zero." |
| Tries to add a friend whose email is not registered | "No user found with that email. Ask them to sign up first." |
| Tries to create a group without typing a name | "Please enter a group name." |
| Session expires and they try to do something | Redirect to login page with message: "Your session has expired. Please log in again." |

All error messages appear in red text near the field that caused the problem — not just at the top of the page.

---

### Flow 6 — What Shows When It Is Working (Success Messages)

| Action Completed | Success Message |
|---|---|
| Account created | "Welcome to Bill Splitter! Your account has been created." |
| Logged in | User is redirected to the dashboard (no extra message needed). |
| Expense added | "Expense added successfully." |
| Expense deleted | "Expense deleted." |
| Group created | "Group created successfully." |
| Friend added to group | "[Friend's name] has been added to the group." |
| Group expense added | "Expense added to the group." |
| Group deleted | "Group and all its expenses have been deleted." |
| Logged out | Redirected to `/login`. No message needed. |

Success messages appear in green and disappear after 3 seconds automatically.

---

## SECTION 5: PAGES AND COMPONENTS

### Page 1 — `/login` (Login Page)

**Purpose:** Lets existing users sign in.

**What is on this page:**

- **Page Title:** "Sign In to Bill Splitter" (large text, centered)
- **Subtitle:** "Track and split your expenses with ease." (smaller grey text)
- **Email Input Field:**
  - Label: "Email Address"
  - Placeholder text: "you@example.com"
  - Input type: email (shows keyboard with @ on mobile)
- **Password Input Field:**
  - Label: "Password"
  - Placeholder text: "Enter your password"
  - Input type: password (text is hidden with dots)
- **Sign In Button:**
  - Text: "Sign In"
  - Full-width button, blue colour
  - Shows "Signing in..." with a spinner while processing
  - Disabled while processing (cannot click twice)
- **Error Message Area:** Red text below the form showing login errors
- **Link to Sign Up:** "Don't have an account? Sign up here" (link at the bottom)

**What this page does NOT have:** No sidebar, no top navigation, no distractions.

---

### Page 2 — `/signup` (Sign Up Page)

**Purpose:** Lets new users create an account.

**What is on this page:**

- **Page Title:** "Create Your Account"
- **Subtitle:** "Join Bill Splitter and start splitting smarter."
- **Full Name Input Field:**
  - Label: "Full Name"
  - Placeholder: "Riya Sharma"
  - Validation: Cannot be empty
- **Email Input Field:**
  - Label: "Email Address"
  - Placeholder: "you@example.com"
  - Validation: Must be valid email format and not already registered
- **Password Input Field:**
  - Label: "Password"
  - Placeholder: "Minimum 8 characters"
  - Validation: Must be at least 8 characters
- **Confirm Password Input Field:**
  - Label: "Confirm Password"
  - Placeholder: "Type your password again"
  - Validation: Must exactly match the password field
- **Create Account Button:**
  - Text: "Create Account"
  - Full-width, blue button
  - Shows "Creating account..." while processing
  - Disabled while processing
- **Error Messages:** Red text shown below the specific field that has an error
- **Link to Login:** "Already have an account? Sign in here"

---

### Page 3 — `/dashboard` (Main Dashboard)

**Purpose:** The home screen after logging in. Shows an overview and contains the navigation.

**What is on this page:**

**Left Sidebar (always visible on desktop):**
- App logo / name "Bill Splitter" at the top
- Navigation links:
  - "Dashboard" (home icon)
  - "My Expenses" (wallet icon)
  - "My Groups" (people icon)
- At the bottom of the sidebar:
  - User's email address (small grey text)
  - "Log Out" button (red or grey text)

**Main Content Area (right side):**
- **Welcome heading:** "Welcome back, [User's Name]!"
- **Quick Stats Row:** Four summary cards showing:
  - Total personal expenses (all time)
  - Total spent this month
  - Number of groups the user belongs to
  - Number of groups the user created
- **Quick Links:** Two buttons — "Add an Expense" and "Create a Group"

**On Mobile (phones):**
- The sidebar is hidden by default.
- A hamburger menu icon (☰) appears at the top left.
- Tapping it slides the sidebar in from the left.
- Tapping outside the sidebar or a link closes it.

---

### Page 4 — `/dashboard/expenses` (My Expenses Page)

**Purpose:** Add and view personal expenses.

**What is on this page:**

**Stats Cards Row (top section):**
- Card 1: "Total Spent (All Time)" — shows total in ₹
- Card 2: "Spent This Month" — shows current month total in ₹
- Card 3: "Total Transactions" — count of all expense entries
- Card 4: "Average Per Transaction" — total ÷ count in ₹

**Add Expense Form (middle section):**
- Section heading: "Add New Expense"
- Description field (text input)
- Amount field (number input — only accepts numbers)
- Category dropdown with these options:
  - Food & Drinks
  - Travel
  - Utilities
  - Entertainment
  - Shopping
  - Health
  - Other
- "Add Expense" button (blue, full-width on mobile)
- Success or error message shown below the button after submission

**Expense List (bottom section):**
- Section heading: "Your Expenses"
- Each expense shows as a card or row containing:
  - Description (bold)
  - Category (small coloured label/badge)
  - Amount in ₹ (large, right-aligned)
  - Date added (small grey text)
  - Delete button (trash icon, red)
- If no expenses yet: a friendly empty state message — "No expenses yet. Add your first one above!"
- List is sorted with newest expense at the top

---

### Page 5 — `/dashboard/groups` (My Groups Page)

**Purpose:** Create and manage expense-sharing groups.

**What is on this page:**

**Stats Cards Row (top section):**
- Card 1: "Groups You Created" — count
- Card 2: "Groups You Joined" — count
- Card 3: "Total Groups" — combined count
- Card 4: "Most Recent Group" — name of the latest group joined or created

**Create Group Form (middle section):**
- Section heading: "Create a New Group"
- Group Name field (text input)
- "Create Group" button (blue)
- Success message after creation: "Group created!"

**Groups List (bottom section):**

Two sub-sections:

**"Groups You Created":**
- Shows all groups this user created.
- Each group card shows:
  - Group name (bold)
  - Date created (small grey text)
  - Number of members
  - Total group expenses in ₹
  - "Open Group" button (goes to group detail page)
  - "Delete Group" button (red, only shown to creator)

**"Groups You Joined":**
- Shows all groups where the user is a member but not the creator.
- Each group card shows:
  - Group name (bold)
  - Created by: [creator's name]
  - Number of members
  - "Open Group" button

**Inside a Group (Group Detail Page — `/dashboard/groups/[group-id]`):**
- Group name as heading
- Members list with each member's name and email
- "Add Member" section (email input + "Add" button) — only shown to creator
- **Balance Summary section:**
  - Total group expenses
  - Each member's: Amount Paid | Fair Share | Balance (owes or is owed)
  - Clearly marked in green (is owed) or red (owes money)
- **Add Group Expense form:**
  - Description field
  - Amount field
  - "Who paid?" dropdown (shows all group member names)
  - Date field
  - "Add Expense" button
- **Group Expense list:**
  - Each row shows: Description | Amount | Paid by [name] | Date | Delete button

---

## SECTION 6: DATABASE SCHEMA

This section explains where and how data is stored. The app uses Supabase as the database.

---

### Table 1 — `users`

Stores basic information about every person who has signed up.

| Column | What it stores | Example |
|---|---|---|
| `id` | A unique code for each user (auto-generated) | `user-uuid-abc123` |
| `email` | The user's email address | `riya@example.com` |
| `name` | The user's full name | `Riya Sharma` |
| `created_at` | Date and time they joined | `2026-04-01 09:30:00` |

**Rules:**
- Email must be unique — no two users can share the same email.
- This table is managed by Supabase Auth automatically.

---

### Table 2 — `personal_expenses`

Stores every personal expense added by individual users.

| Column | What it stores | Example |
|---|---|---|
| `id` | Unique ID for each expense | `exp-uuid-001` |
| `user_id` | Which user added this expense (links to users table) | `user-uuid-abc123` |
| `description` | What the expense was for | `"Coffee at CCD"` |
| `amount` | How much was spent | `180.00` |
| `category` | Type of expense | `"Food & Drinks"` |
| `created_at` | When the expense was added | `2026-05-10 14:22:00` |

**Rules:**
- Each expense belongs to one user.
- A user can only read, edit, or delete their own expenses.
- Amount must be a positive number.

---

### Table 3 — `shared_groups`

Stores information about every group that has been created.

| Column | What it stores | Example |
|---|---|---|
| `id` | Unique ID for the group | `group-uuid-007` |
| `name` | Name of the group | `"Goa Trip 2026"` |
| `created_by` | User ID of the person who created it (links to users table) | `user-uuid-abc123` |
| `created_at` | When the group was created | `2026-03-15 10:00:00` |

**Rules:**
- Any registered user can create a group.
- Only the creator (`created_by`) can delete the group.
- Deleting a group automatically deletes all related records in `group_members` and `group_expenses`.

---

### Table 4 — `group_members`

Stores which users belong to which groups. This is a joining table — it connects users and groups.

| Column | What it stores | Example |
|---|---|---|
| `id` | Unique ID for this membership record | `mem-uuid-011` |
| `group_id` | Which group (links to shared_groups table) | `group-uuid-007` |
| `user_id` | Which user is in this group (links to users table) | `user-uuid-xyz456` |
| `joined_at` | When the user was added to the group | `2026-03-15 10:05:00` |

**Rules:**
- One user can be in many groups.
- One group can have many users.
- The group creator is also added as a member automatically when the group is created.
- Only the group creator can add or remove members.

---

### Table 5 — `group_expenses`

Stores every shared expense that has been logged inside a group.

| Column | What it stores | Example |
|---|---|---|
| `id` | Unique ID for this expense | `gexp-uuid-022` |
| `group_id` | Which group this expense belongs to (links to shared_groups table) | `group-uuid-007` |
| `paid_by` | Which user paid this (links to users table) | `user-uuid-abc123` |
| `description` | What was spent on | `"Beach resort dinner"` |
| `amount` | How much was paid | `2400.00` |
| `expense_date` | The date of the expense | `2026-04-20` |
| `created_at` | When it was entered in the app | `2026-04-21 08:00:00` |

**Rules:**
- Only group members can add expenses to a group.
- Any group member can add a group expense.
- Only the person who created the expense or the group creator can delete it.

---

### What Happens When a Group is Deleted

When a group is deleted, the following also gets deleted automatically (this is called "cascade delete"):

1. All rows in `group_members` that belong to that group.
2. All rows in `group_expenses` that belong to that group.

This means there is no leftover data. The database is kept clean.

---

## SECTION 7: AUTHENTICATION & SECURITY

### How Sign Up and Login Work

Users register using their **email address and password**. This is handled by Supabase Auth, which is a well-tested, industry-standard authentication system. When a user signs up:

1. Supabase checks that the email is not already registered.
2. The password is immediately hashed (scrambled into a code that cannot be reversed).
3. A secure session token is created and stored in the user's browser.

When a user logs in, their password is hashed again and compared to the stored hash — the original password is never stored or transmitted anywhere.

---

### Passwords Are Never Stored as Plain Text

The actual password (e.g., "MyPassword123") is **never saved** in the database. It is converted using a one-way hashing function (bcrypt). Even if someone accessed the database directly, they would see only the hash — not the real password. This is a standard and required security practice.

---

### Users Can Only See Their Own Expenses

Every personal expense row in the database has a `user_id` column. The database has a security rule that says:

> "A user may only read or delete a personal expense row if the `user_id` on that row matches their own user ID."

This means even if a person tried to request someone else's expenses through the app's backend, the database would simply refuse and return nothing.

---

### Users Can Only See Groups They Belong To

The database has a security rule on the `shared_groups` and `group_expenses` tables:

> "A user may only read a group or its expenses if there is a row in `group_members` with their user ID and that group's ID."

This means someone cannot see a group they were not added to — even by guessing the group's ID in the web address bar.

---

### Database Enforces Rules (Not Just the Website)

These privacy rules are written directly into the database using **Row Level Security (RLS)** — a feature of Supabase. This is important because:

- Website code can have bugs or be bypassed.
- The database is the last line of defence.
- Even if the website code breaks, the database will not allow unauthorized access.

---

### Secret Keys Are Never in Public Code

The app uses secret keys to connect to the database and to handle authentication. These keys are stored as **environment variables** — private settings that are not part of the code file and are never uploaded to a public place like GitHub.

| Variable | What it contains |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The address of the Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public-facing key for the app |
| `SUPABASE_SERVICE_ROLE_KEY` | A private admin key (never exposed to browser) |

The service role key is only ever used in server-side code, never in browser code.

---

## SECTION 8: NON-FUNCTIONAL REQUIREMENTS

### Mobile Phones — The App Works on All Screen Sizes

The app is designed to work on screens of all sizes — from a small phone to a large desktop monitor.

**On phones (less than 768px wide):**
- The sidebar is hidden. A hamburger menu (☰) appears at the top.
- Tapping the icon slides the sidebar in. Tapping outside closes it.
- Forms become full-width (no side-by-side columns).
- Stats cards stack vertically (instead of showing in a row).
- Buttons are large enough to tap with a finger.

**On tablets and desktops:**
- The sidebar is always visible on the left.
- Content takes up the remaining space on the right.
- Stats cards appear in a horizontal row.

This behaviour is built using Tailwind CSS responsive classes and does not require any extra plugins.

---

### Loading — Buttons Show Feedback and Cannot Be Clicked Twice

Whenever the app is doing something (saving data, fetching data, logging in), it shows the user that something is happening:

- Buttons change their text to show a loading state. Examples:
  - "Sign In" → "Signing in..."
  - "Add Expense" → "Adding..."
  - "Create Group" → "Creating..."
- A small spinning icon may appear next to the button text.
- The button is disabled while loading, so clicking it again does nothing.
- Lists show a subtle loading message ("Loading your expenses...") while data is being fetched.

This prevents duplicate entries and makes the app feel responsive.

---

### Errors — Messages Are in Plain English

The app never shows raw error codes or technical messages to users. Instead:

**If the database is unreachable:**
→ "We could not connect to the server. Please check your internet and try again."

**If a form field is empty:**
→ "This field cannot be empty."

**If a number field has text:**
→ "Please enter a valid number."

**If a session expires:**
→ "You have been logged out. Please sign in again."

**If adding a friend fails:**
→ "We could not find a user with that email. Please check the email and try again."

Errors appear in red text near the field or action that caused them. They never appear as a browser pop-up alert.

---

### Speed — The App Loads Fast

Several choices are made to keep the app fast:

- Pages load only the data they need. The expenses page does not load group data, and vice versa.
- Data is fetched from the database only when a page is first opened, not repeatedly in the background.
- Next.js automatically splits the code so each page only loads its own required code — not everything at once.
- Images (if any) are compressed and served in modern formats.
- The sidebar navigation changes the page content without doing a full browser reload, making navigation feel instant.

---

### Deployment — The App Is Hosted Online and Updates Automatically

The app is deployed on **Vercel**, a hosting platform built specifically for Next.js apps.

**How deployment works:**
1. The developer pushes code changes to GitHub (the code repository).
2. Vercel detects the new code automatically.
3. Within 1–2 minutes, a new version of the app is live online.
4. If something breaks, Vercel allows rolling back to the previous working version instantly.

**The live app is always available at a public URL.** No manual upload or server management is needed. Users always access the latest version automatically.

**Environments:**

| Environment | Purpose | URL |
|---|---|---|
| Production | Live app for real users | `https://billsplitter.app` (example) |
| Preview | Test new features before going live | `https://preview.billsplitter.app` (example) |

---

*End of Product Requirements Document*
*Bill Splitter App — Version 1.0 — June 2026*
