# Project GridWatch by VAULt 🤖⚡

This repository contains the source code for **Project VAULt**, developed by **Team VAULt** from the **Department of Electronic & Telecommunication Engineering (EN)** at the **University of Moratuwa**, for the **EN3350 Software Design Competition** project.  

The project aims to create a complete software solution for **automating thermal inspections of distribution transformers**. This includes:  
- Recording and managing transformer data  
- Uploading and categorizing thermal images  
- Automated anomaly detection using computer vision  
- Interactive annotations  
- Maintenance record generation  

---

## Project Phases

### **Phase 1: Transformer and Baseline Image Management** ✅ *Completed*  
- Admin interface to add transformer records (ID, location, capacity, region, pole number, type)  
- Uploading thermal images (baseline and maintenance) tagged to transformers and inspections  
- Categorizing baseline images by environmental conditions (sunny, cloudy, rainy)  
- User interfaces for listing transformers, inspections, and uploading images, as detailed in the *[Phase 1 User Interfaces PDF]*  

---

### **Phase 2: Automated Anomaly Detection** 🚧 *In Progress*  

### **Phase 3: Interactive Annotation & Feedback** 🚧 *In Progress*  

### **Phase 4: Maintenance Record Sheet Generation** 🚧 *In Progress*  

---

## Current Status
Currently, the system fully supports all features from **Phase 1**, including intuitive user interfaces for efficient data management.  
Future commits will integrate **Phases 2–4**.  

---
## Tech Stack

- **Frontend:** React – Provides a responsive and interactive user interface with modern components for dashboards, modals, and tables.  
- **Backend:** Java with Spring Framework – Handles scalable backend logic, RESTful APIs, database interactions, and user authentication.  
- **Database:** PostgreSQL  
- **Target Platform:** Web browser  
- **Other Tools & Libraries:**  
  - Axios for API calls  
  - React Router for navigation  
  - Material-UI (or similar) for styling (based on UI designs)  
  - JUnit for testing  
  - Libraries for image handling  

---

The system follows a **modular architecture** to ensure **scalability** and **maintainability**. 

---

## Installation

### Prerequisites
- **Node.js** (v14+ for React frontend)  
- **Java JDK** (v17+ for Spring backend)  
- **Maven** (for building the backend)  
- **PostgreSQL** (or MySQL) – Configure connection details in `application.properties`  
- **Git**

---

### Steps

#### 1. Clone the repository
```bash
https://github.com/AnushkaSamaranayake/VAULt_Power_plant_management_software.git
```
