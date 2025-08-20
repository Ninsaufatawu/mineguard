# MineGuard - Mining License Monitoring System

This is a [Next.js](https://nextjs.org/) project that provides monitoring and reporting capabilities for mining licenses and satellite detection of illegal mining activities.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup Scripts

This project includes several scripts for setting up the database:

### Parsing Mining License CSV

To import mining licenses from the CSV file:

```bash
npm run parse-mining-csv
```

This script:
1. Loads the mining_licenses.csv file from the public directory
2. Uses papaparse to parse the CSV data
3. Converts the geometry field (WKT) into PostGIS geom using SRID 4326
4. Converts start_date and expiry_date to Date objects
5. Inserts each row into Supabase

### Creating Satellite Reports Table

To create and seed the satellite_reports table:

```bash
npm run create-satellite-reports
```

This creates a table with the following structure:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- title TEXT
- district TEXT
- lat FLOAT
- lng FLOAT
- before_image_url TEXT
- after_image_url TEXT
- ndvi_image_url TEXT
- detected_at TIMESTAMP DEFAULT now()

### Seeding Sample Licenses

To seed sample license data:

```bash
npm run seed-licenses
```

## Environment Setup

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

For more about Supabase and PostGIS:

- [Supabase Documentation](https://supabase.io/docs)
- [PostGIS Documentation](https://postgis.net/docs/)


-- Create a SQL function to insert records that bypasses RLS
CREATE OR REPLACE FUNCTION insert_concession(
  p_name TEXT,
  p_code TEXT,
  p_owner TEXT,
  p_type TEXT,
  p_country TEXT,
  p_status TEXT,
  p_start_date TEXT,
  p_expiry_date TEXT,
  p_assets TEXT,
  p_wkt_geometry TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This will run with the privileges of the function creator
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Insert the record
  INSERT INTO concessions (
    name, code, owner, type, country, status, 
    start_date, expiry_date, assets, geom
  ) VALUES (
    p_name, p_code, p_owner, p_type, p_country, p_status,
    p_start_date::DATE, p_expiry_date::DATE, p_assets,
    ST_GeomFromText(p_wkt_geometry, 4326)
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION insert_concession TO authenticated;

# MineGuard

## Database Scripts

The following scripts are available to help with database setup and data import:

### 1. Setup Database Tables

The `setup-db.sql` file contains all the SQL commands to create the necessary tables and functions. To use it:

1. Go to your Supabase dashboard > SQL Editor
2. Create a new query
3. Open `scripts/setup-db.sql` in your local editor
4. Copy and paste the SQL content into the Supabase SQL Editor
5. Run the SQL commands

This will create:
- `satellite_reports` table
- `concessions` table with PostGIS geometry support
- Required functions for importing data with geometry

### 2. Import Concessions with Geometry

To import mining concessions with geometry data from the CSV file:

```bash
npm run import-concessions
```

This script:
- Reads the CSV file from `public/mining_licenses.csv`
- Processes records in batches to avoid timeout issues
- Uses retry logic to handle network errors
- Properly converts WKT geometry to PostGIS format

### 3. Update Existing Records with Geometry

If you already imported records but need to add geometry data to them:

```bash
npm run update-geometries
```

### 4. Disable Row Level Security (if needed)

If you encounter permission issues:

```bash
npm run disable-rls
```

**Note:** Disabling RLS is only recommended for development environments.

## Database Schema

### satellite_reports
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `title` TEXT
- `district` TEXT
- `lat` FLOAT
- `lng` FLOAT
- `before_image_url` TEXT
- `after_image_url` TEXT
- `ndvi_image_url` TEXT
- `detected_at` TIMESTAMP DEFAULT now()

### concessions
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name` TEXT
- `code` TEXT
- `owner` TEXT
- `type` TEXT
- `country` TEXT
- `status` TEXT
- `start_date` DATE
- `expiry_date` DATE
- `assets` TEXT
- `geom` GEOMETRY(POLYGON, 4326)