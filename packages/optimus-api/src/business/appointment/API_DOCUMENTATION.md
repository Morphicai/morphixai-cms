# Appointment Module API Documentation

## Overview

The appointment module is used to collect user appointment information, including phone number, stage, channel, appointment time, and extra fields.

## API Endpoints

### 1. Create Appointment Record

**Endpoint**: `POST /biz/appointment/create`

**Authentication**: GameWemade Guard authentication (requires the following parameters in Headers)

**Headers**:
- `gamewemade-uid`: User ID
- `business-sign`: Signature
- `business-timestamp`: Timestamp (milliseconds or seconds)

**Request Parameters**:

```json
{
  "phone": "13800138000",
  "stage": "Test Stage",
  "channel": "Official Website",
  "appointmentTime": "2024-01-01T10:00:00Z",
  "extraField1": "Remarks"
}
```

**Parameter Description**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phone | string | Yes | Phone number |
| stage | string | Yes | Stage |
| channel | string | Yes | Channel |
| appointmentTime | string | Yes | Appointment time (ISO 8601 format) |
| extraField1 | string | No | Extra field 1 |

**Response Example**:

```json
{
  "code": 200,
  "msg": "Appointment successful",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "stage": "Test Stage",
    "channel": "Official Website",
    "appointmentTime": "2024-01-01T10:00:00.000Z",
    "extraField1": "Remarks",
    "createDate": "2024-01-01T10:00:00.000Z",
    "updateDate": "2024-01-01T10:00:00.000Z"
  }
}
```

### 2. Query Appointment Record List

**Endpoint**: `GET /biz/appointment/list`

**Authentication**: JWT Token

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number, starts from 1, default 1 |
| pageSize | number | No | Items per page, default 10 |
| phone | string | No | Phone number (fuzzy search) |
| stage | string | No | Stage (exact match) |
| channel | string | No | Channel (exact match) |
| sortField | string | No | Sort field |
| sortOrder | string | No | Sort direction (ascend/descend) |

**Response Example**:

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "phone": "13800138000",
        "stage": "Test Stage",
        "channel": "Official Website",
        "appointmentTime": "2024-01-01T10:00:00.000Z",
        "extraField1": "Remarks",
        "createDate": "2024-01-01T10:00:00.000Z",
        "updateDate": "2024-01-01T10:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 3. Export Appointment Records

**Endpoint**: `GET /biz/appointment/export`

**Authentication**: JWT Token

**Request Parameters**: Same as query list interface

**Response**: Excel file download

## Signature Generation Rules

When using GameWemade guard authentication, signature needs to be generated. Signature generation steps:

1. Collect parameters: uid, all request body fields, query parameters, timestamp
2. Sort parameters alphabetically
3. Concatenate in `key1=value1&key2=value2` format
4. Use MD5 encryption (concatenated string + openKey)
5. Put signature in `business-sign` Header

## Database Table Structure

```sql
CREATE TABLE `biz_appointment` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Appointment record ID',
  `phone` varchar(20) NOT NULL COMMENT 'Phone number',
  `stage` varchar(100) NOT NULL COMMENT 'Stage',
  `channel` varchar(100) NOT NULL COMMENT 'Channel',
  `appointment_time` timestamp NOT NULL COMMENT 'Appointment time',
  `extra_field_1` varchar(500) DEFAULT NULL COMMENT 'Extra field 1',
  `create_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_stage` (`stage`),
  KEY `idx_channel` (`channel`),
  KEY `idx_create_date` (`create_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Appointment record table';
```

## Notes

1. Create appointment interface uses GameWemade guard authentication, does not require JWT Token
2. Query and export interfaces require JWT Token authentication
3. Appointment records do not support delete operation
4. Export function exports corresponding data based on query conditions
