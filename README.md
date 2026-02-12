POC MAP — ADMIN / IT README 

1. Local Setup 

Start the Project 

THINGS TO DOWNLOAD: 

NODE.js 

MySQL 

Code Compiler (VS CODE or any other) 

GITHUB: https://github.com/ZylerPepito/locality_poc.git 

DRIVE (DOWNLOAD ZIP): https://drive.google.com/drive/folders/1EVvawEC6cGyDsBpg9pIp9IsSPyxf1CRB?usp=sharing 

Open Terminal inside the project folder and run: 

npm start 
 

Example path: 

cd C:\Users\name\Documents\locality_poc 
 

 

Database Configuration 

If running locally, update the database credentials in: 

db.js 
 

Example local configuration: 

const db = mysql.createConnection({ 
 host: "localhost", 
 user: "root", 
 password: "", 
 database: "employee_map" 
}); 
 

Change these values depending on your local or public database. 

 

Required Database Tables 

Employees Table 

CREATE TABLE `employees` ( 
 `id` int(11) NOT NULL AUTO_INCREMENT, 
 `name` varchar(255) NOT NULL, 
 `position` varchar(255) NOT NULL, 
 `phone` varchar(50) NOT NULL DEFAULT '', 
 `emergency_contact` varchar(255) NOT NULL DEFAULT '', 
 `address` varchar(500) NOT NULL, 
 `exact_address` varchar(255) NOT NULL, 
 `latitude` decimal(10,7) NOT NULL, 
 `longitude` decimal(10,7) NOT NULL, 
 `photo_data` longtext DEFAULT NULL, 
 `photo_name` varchar(255) DEFAULT NULL, 
 `is_archived` tinyint(1) NOT NULL DEFAULT 0, 
 `created_at` datetime NOT NULL DEFAULT current_timestamp(), 
 PRIMARY KEY (`id`) 
); 
 

 

Users Table 

CREATE TABLE `users` ( 
 `id` int(11) NOT NULL AUTO_INCREMENT, 
 `username` varchar(100) NOT NULL, 
 `password_hash` varchar(255) NOT NULL, 
 `created_at` timestamp NOT NULL DEFAULT current_timestamp(), 
 PRIMARY KEY (`id`), 
 UNIQUE KEY `username` (`username`) 
); 
 

 

2. Accessing the App 

Local Access 

Open your browser and go to: 

http://localhost:3000/login.html 
 

Public Deployment 

Use the domain URL provided by your hosting service. 

 

3. Default Login Credentials 

Admin Login 

Username: poc@admin 

Password: phoperations_local123 

After logging in, you can: 

Add employees 

Edit employee details 

Delete employees 

Archive / unarchive employees 

 

4. Admin User Management Page 

To manage application users, open: 

http://localhost:3000/admin-create 
 

ONLY AUTHORIZED FOR ADMIN AFTER THEY LOGGED IN. 

From this page, an admin can: 

Create new users 

Change usernames or passwords 

Delete users who should no longer have access 

(Mainly used for public server deployments.) 

 

5. Deployment Notes & Suggestions 

Hosting Issues Encountered 

Fly.io 

Repository upload did not work properly for this project. Although You can try 

Railway 

Domain and SQL server run successfully. 

Password hashing compatibility issues encountered. 

Appears to reject certain bcrypt-hashed password formats. 

Could be due to no query option or node version or limited access to netlify 

Possible Solutions 

Use Firebase Authentication or another third-party auth provider. 

Use mongodb database. 

Test alternative hashing libraries or bcrypt configurations. 

Avoid plain-text passwords unless absolutely necessary 

(not recommended due to security risks). 

Cost Consideration 

Railway requires payment after the trial period. 

 

Alternative Hosting Strategy 

Netlify 

Free for frontend hosting only. 

Backend must be hosted elsewhere (Railway, Firebase, etc.). 

May require CORS configuration when separating frontend and backend. 

Render 

Attempted but unfamiliar workflow; not fully configured. 

 

6. Recommendation 

For a secure and stable production setup: 

Use Firebase Auth (or similar) for authentication. 

Host backend on Railway or MongoDB . 

Host frontend on Netlify or Render if needed. 

Properly configure CORS between services. 

Plan for paid hosting for long-term deployment. 

 
