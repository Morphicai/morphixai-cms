# Appointment Module

## Feature Overview

The appointment module is used to collect user appointment information, including:
- Phone number
- Stage
- Channel
- Appointment time
- Extra field 1

## Module Structure

```
appointment/
├── dto/
│   ├── create-appointment.dto.ts    # Create appointment DTO
│   └── query-appointment.dto.ts     # Query appointment DTO
├── entities/
│   └── appointment.entity.ts        # Appointment entity
├── appointment.controller.ts        # Controller
├── appointment.service.ts           # Service layer
├── appointment.module.ts            # Module definition
├── API_DOCUMENTATION.md             # API documentation
└── README.md                        # This file
```

## Main Features

### 1. External Interface (Uses GameWemade Guard)

- **POST /biz/appointment/create**: Create appointment record
  - Uses GameWemade guard authentication
  - Requires `gamewemade-uid`, `business-sign`, `business-timestamp` in Headers
  - Does not require JWT Token

### 2. Admin Interface (Requires JWT Authentication)

- **GET /biz/appointment/list**: Query appointment record list
  - Supports filtering by phone number, stage, channel
  - Supports pagination and sorting
  
- **GET /biz/appointment/export**: Export appointment records as Excel
  - Supports export by query conditions
  - Automatically generates filename

### 3. Data Features

- Appointment records **cannot be deleted** (meets business requirements)
- Supports view and export functions
- Automatically records creation time and update time

## Frontend Page

Frontend admin interface is located at `packages/optimus-ui/src/pages/appointment/`

### Features

- Uses ProTable component to display data
- Supports search by phone number, stage, channel
- Supports Excel export
- Does not provide delete function (data cannot be deleted)

## Usage

### Backend Deployment

1. Module is automatically registered in `app.module.ts`
2. Database table is automatically created (via TypeORM)

### Frontend Usage

1. Can see "Appointment Management" under system management menu
2. Click to enter and view all appointment records
3. Supports search and export functions

## API Examples

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Development Standards

This module follows project development standards:
- Uses pnpm as package manager
- Uses dayjs for date handling
- Page numbers start from 1
- All API calls go through Service layer
