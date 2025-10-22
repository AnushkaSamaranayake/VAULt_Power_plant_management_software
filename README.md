# Project GridWatch by VAULt 🤖⚡

<p align="center">
  <img src="images/gridwatch-high-resolution-logo.png" alt="GridWatch Logo" width="200" />
  &nbsp;&nbsp;&nbsp; <!-- optional spacing -->
  <img src="images/vault-high-resolution-logo.png" alt="Second Image" width="200" />
</p>

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

### **Phase 2: Automated Anomaly Detection** ✅ *Completed*  
- Integrate YOLO for AI-Based Anomaly detection which can compare new maintenance images of the transformer with the baseline image
- Define a detection threshold to identify anomalies in the thermal images
- Side by side comparison of maintenance and baseline images after Anomaly detection with zoom, click & drag, and reset functionalities

### **Phase 3: Interactive Annotation & Feedback** 🚧 *In Progress*  

### **Phase 4: Maintenance Record Sheet Generation** 🚧 *In Progress*  

---

## Current Status
Currently, the system fully supports all features from **Phase 1 & 2**, including intuitive user interfaces for efficient data management.  
Future commits will integrate **Phases 3&4**.  

---
## Tech Stack

- **Frontend:** React – Provides a responsive and interactive user interface with modern components for dashboards, modals, and tables.  
- **Backend:** Java with Spring Framework – Handles scalable backend logic, RESTful APIs, database interactions, and user authentication.
- **Vision Model:** YOLOv8 for AI-Based anomaly detection.   
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
- **Python**(v3.8+ for YOLO API)   
- **Git**

---

# Steps

Follow the steps given below to succesfully run the backend, vision model, and frontend. 

---


# Backend (PostgreSQL+Spring Boot)


#### Clone the repository 💻
```bash
git clone https://github.com/AnushkaSamaranayake/VAULt_Power_plant_management_software.git
cd VAULt_Power_plant_management_software/backend
```

#### Install Dependencies 📦

```bash
mvn clean install
```

### PostgreSQL setup 🐘

1. Log into PostgreSQL

```bash
psql -U postgres
```
2. Create a database and user

```bash
CREATE DATABASE transformerdb;
CREATE USER springuser WITH PASSWORD 'secretpassword';
GRANT ALL PRIVILEGES ON DATABASE transformerdb TO springuser;
```
### Define environment variables

Create a .env file inside the backend/ directory:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transformerdb
DB_USERNAME=springuser
DB_PASSWORD=secretpassword

```

### Configure Spring Boot

Update src/main/resources/application.properties to use environment variables:

```bash
spring.application.name=transformerthermalinspector

# Import .env file (optional, Spring Boot 2.4+)
spring.config.import=optional:file:.env

# PostgreSQL connection with defaults
spring.datasource.url=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# JPA settings
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# File upload settings
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
app.upload.dir=uploads/images

# Logging
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
logging.level.org.springframework.jdbc.core.JdbcTemplate=DEBUG
logging.level.org.springframework.jdbc.core.StatementCreatorUtils=TRACE

```
🔔 Note: If using the .env file, make sure you have the dependency in your pom.xml:

```bash
<dependency>
  <groupId>me.paulschwarz</groupId>
  <artifactId>spring-dotenv</artifactId>
  <version>2.5.4</version>
</dependency>

```
This library automatically loads .env into Spring Boot.
___
### ▶️ Running the Application

Run with Maven:

```bash
mvn spring-boot:run
```
The backend will be available at:
👉 http://localhost:8080

___
# Vision Model for AI-Powered Thermal Image Analysis (YOLOv8)

## Getting Started
Navigate to the 'yolo-api' directory.
```bash

cd VAULt_Power_plant_management_software/yolo-api
```
Create virtual Python environment and install required modules.

```bash
python -m venv venv
venv/Scripts/activate
pip install -r requirements.txt
```

Run the Yolo-API server using the following command.

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

The server will be now running on port 5000.

---
## Overview of the Detection Approach

First we downloaded the dataset given and uploaded it to the **Roboflow** platform. There we defined 3 classes as follows.
- **Normal** (Class 1) - Blue areas
- **Faulty** (Class 0) - Reddish areas of the transformer body
- **Potentially Faulty** (Class 2) - Orange,Yellowish areas of the transformer body and reddish areas of the wires

After that images were manually annotated with these three classes and added data augmentation (Shear, Saturation, Blur) to the images and created a dataset with 273 images.

Then dataset was split into the following criteria:
- Train - 80 %
- Validation - 12%
- Test  - 8%

Then a **YoloV8** model with 150 epochs was trained using a T4 GPU in Google Colab and the trained model then compiled in Pytorch binary file format (.pt) and hosted locally.

More details on the full implementation of the model: [YOLOv8 Details](backend/AI_INTEGRATION_README.md)

---

# Frontend (React + Vite + Tailwind)

This is the frontend of the project, built with **React**, **Vite**, and **Tailwind CSS**.  
It provides the user interface and communicates with the backend API.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- npm (comes with Node.js)

### Install Dependencies

```bash
npm install
```

___

## Running the Frontend in Development

Start the Vite server.

```bash
npm run dev
```

The backend will be available at:
👉 http://localhost:5173

## Building for Production

To generate an optimized production build:

```bash
npm run build
```

The output will be in the dist/ folder.

These are the static files you can deploy to any hosting service.

## Preview the production build

You can locally test the production build:
```bash
npm run preview
```

This will start a server that serves the files from dist/.

___

## Workflow through the the Interface

The videos explaining the workflows through the User Interface for all the currently completed phases can be accessed using the following links.🎥

**Phase 1:**  
👉 [Watch the Workflow Video for Phase 1](<https://drive.google.com/file/d/1oBK7fp4eDmFDBDKQfPqj_T-U-D35DcXK/view?usp=sharing)>) 

**Phase 2:**   
👉 [Watch the Workflow Video for Phase 2](<https://drive.google.com/file/d/1H7QtidcNJImsieT4mtIxQo6YSV7QhpDt/view?usp=drive_link>) 

**Phase 3:**  
👉 [Watch the Workflow Video for Phase 3](<https://drive.google.com/file/d/1oBK7fp4eDmFDBDKQfPqj_T-U-D35DcXK/view?usp=sharing)>) 
