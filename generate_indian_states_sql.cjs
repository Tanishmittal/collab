const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json';
const migrationPath = './supabase/migrations/20260413150000_add_states_and_districts.sql';

https.get(url, (res) => {
    let body = "";

    res.on("data", (chunk) => {
        body += chunk;
    });

    res.on("end", () => {
        try {
            const data = JSON.parse(body);
            let sql = `-- Adding state column to cities
ALTER TABLE "public"."cities" ADD COLUMN IF NOT EXISTS "state" text NOT NULL DEFAULT 'Other';

-- Truncate existing data to load the official state-district map
TRUNCATE TABLE "public"."cities";

-- Insert new data
INSERT INTO "public"."cities" ("name", "slug", "state", "is_active", "sort_order") VALUES
`;

            let values = [];
            let r_id = 1;

            if (data.states) {
                // Parse correctly if root is wrapped in { states: [...] }
                for (const stateObj of data.states) {
                    const stateName = stateObj.state;
                    for (const district of stateObj.districts) {
                        const slug = district.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        const sanitizedDistrict = district.replace(/'/g, "''");
                        const sanitizedState = stateName.replace(/'/g, "''");
                        values.push(`('${sanitizedDistrict}', '${slug}', '${sanitizedState}', true, ${r_id++})`);
                    }
                }
            } else {
                console.error("Unexpected JSON structure", data);
                process.exit(1);
            }

            sql += values.join(",\n") + ";\n";

            fs.writeFileSync(migrationPath, sql);
            console.log(`Successfully wrote migration to ${migrationPath} with ${values.length} districts.`);
        } catch (error) {
            console.error(error.message);
        }
    });

}).on("error", (error) => {
    console.error(error.message);
});
