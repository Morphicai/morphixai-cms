# Dictionary JSON Database

## Feature Overview

Lightweight JSON database based on Dictionary, supporting:

✅ **Collection Management**: Create collections in admin, define data types (object, array, string, number, boolean, image, file)  
✅ **Convenient Service**: Provides quick access methods for using configuration data in code  
✅ **Public Access**: When collection is set to public, C-end can query data  
✅ **Public Read-Write**: When collection is set to public read-write, C-end can modify data  
✅ **Config Service**: Dedicated ConfigService for managing AI config, API Keys, prompts, etc.

## Core Files

```
dictionary/
├── entities/
│   ├── dictionary.entity.ts              # Dictionary data entity
│   └── dictionary-collection.entity.ts   # Collection configuration entity
├── services/
│   ├── dictionary.service.ts                 # Dictionary data service
│   ├── dictionary-collection.service.ts      # Collection configuration service
│   └── config.service.ts                     # Config service (convenient access)
├── controllers/
│   ├── dictionary.controller.ts              # Admin dictionary management
│   ├── dictionary-collection.controller.ts   # Admin collection management
│   └── public-dictionary.controller.ts       # C-end public access
└── dictionary.module.ts                       # Module definition
```

## Database Tables

```sql
-- Collection configuration table
dictionary_collection
├── id               Primary key
├── name             Collection name (unique)
├── display_name     Display name
├── data_type        Data type
├── is_public        Is public (0=private, 1=public read)
├── is_writable      Is writable (0=read-only, 1=public read-write)
└── max_items        Maximum items

-- Dictionary data table
dictionary
├── id               Primary key
├── collection       Collection name (foreign key)
├── key              Data key (unique within collection)
├── value            Data value (JSON)
└── sort_order         Sort order
```

## Predefined Collections

### 1. ai_config - AI Configuration
- **Data Type**: array
- **Access**: Private
- **Usage**: Store AI provider configurations (OpenAI, Azure, Anthropic, etc.)

### 2. api_keys - API Keys
- **Data Type**: object
- **Access**: Private
- **Usage**: Manage API Keys exposed to other systems

### 3. ai_prompts - AI Prompts
- **Data Type**: object
- **Access**: Private
- **Usage**: Store AI prompt templates

### 4. system_config - System Configuration
- **Data Type**: object
- **Access**: Private
- **Usage**: Global system configuration

## Quick Start

### 1. Execute Database Migration

```bash
# Create table structure
mysql -u root -p your_database < scripts/migrations/create-dictionary-table.sql

# Initialize data
mysql -u root -p your_database < scripts/migrations/init-dictionary-data.sql
```

### 2. Use in Code

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/system/dictionary/config.service';

@Injectable()
export class YourService {
    constructor(private readonly configService: ConfigService) {}

    async example() {
        // Get AI configuration
        const aiConfig = await this.configService.getAIConfig('openai');
        
        // Render prompt
        const prompt = await this.configService.renderPrompt('sensitive_content_detection', {
            content: 'Text to detect'
        });
        
        // Validate API Key
        const apiKeyConfig = await this.configService.validateAPIKey('sk_xxx');
    }
}
```

### 3. C-end Access Public Data

```typescript
// Get public collection data
const response = await fetch('/api/dictionary/banners');
const { data } = await response.json();
```

## API Endpoints

### Admin Management

- `POST /system/dictionary-collection` - Create collection
- `PUT /system/dictionary-collection/:id` - Update collection
- `DELETE /system/dictionary-collection/:id` - Delete collection
- `GET /system/dictionary-collection` - Query collection list
- `POST /system/dictionary` - Create dictionary data
- `PUT /system/dictionary/:id` - Update dictionary data
- `DELETE /system/dictionary/:id` - Delete dictionary data
- `GET /system/dictionary` - Query dictionary list

### C-end Public Access

- `GET /api/dictionary/:collection` - Get public collection data
- `GET /api/dictionary/:collection/:key` - Get single data
- `POST /api/dictionary/:collection` - Create data (requires collection writable)
- `PUT /api/dictionary/:collection/:key` - Update data (requires collection writable)

## Usage Scenarios

### Scenario 1: AI Feature Configuration

```typescript
// Configure OpenAI
await configService.updateAIConfig('openai', {
    apiKey: 'sk-xxx',
    enabled: true
});

// Use configuration to call AI
const config = await configService.getAIConfig('openai');
const response = await axios.post(`${config.baseUrl}/chat/completions`, {
    model: config.model,
    messages: [{ role: 'user', content: 'Hello' }]
}, {
    headers: { 'Authorization': `Bearer ${config.apiKey}` }
});
```

### Scenario 2: Dynamic Banner Carousel

```typescript
// Admin creates banner collection (public read)
POST /system/dictionary-collection
{
  "name": "banners",
  "isPublic": 1,
  "isWritable": 0
}

// Add banner
POST /system/dictionary
{
  "collection": "banners",
  "key": "banner1",
  "value": {
    "title": "New Year Event",
    "image": "https://cdn.example.com/banner.jpg"
  }
}

// C-end get banners
GET /api/dictionary/banners
```

## Notes

1. **Security**: Sensitive configurations (e.g., API Keys) should not be set to public
2. **Performance**: Frequently accessed configurations should use caching
3. **Permissions**: Admin management requires `system:dictionary:*` permission
4. **Foreign Key Constraints**: Deleting collection will cascade delete all data
5. **Data Validation**: Public writable collections need additional data validation
