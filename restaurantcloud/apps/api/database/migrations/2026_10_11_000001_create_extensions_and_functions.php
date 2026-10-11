<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";
            CREATE EXTENSION IF NOT EXISTS "unaccent";
            CREATE EXTENSION IF NOT EXISTS "pg_trgm";

            CREATE OR REPLACE FUNCTION fn_uuid_v8() 
            RETURNS UUID AS $$
            DECLARE
                v_time BIGINT;
                v_bytes BYTEA;
            BEGIN
                v_time := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
                v_bytes := gen_random_bytes(16);
                
                v_bytes := set_byte(v_bytes, 0, ((v_time >> 40) & 255)::INT);
                v_bytes := set_byte(v_bytes, 1, ((v_time >> 32) & 255)::INT);
                v_bytes := set_byte(v_bytes, 2, ((v_time >> 24) & 255)::INT);
                v_bytes := set_byte(v_bytes, 3, ((v_time >> 16) & 255)::INT);
                v_bytes := set_byte(v_bytes, 4, ((v_time >> 8) & 255)::INT);
                v_bytes := set_byte(v_bytes, 5, (v_time & 255)::INT);
                
                v_bytes := set_byte(v_bytes, 6, ((get_byte(v_bytes, 6) & 15) | 128)::INT);
                v_bytes := set_byte(v_bytes, 8, ((get_byte(v_bytes, 8) & 63) | 128)::INT);
                
                RETURN encode(v_bytes, 'hex')::UUID;
            END;
            $$ LANGUAGE plpgsql VOLATILE;

            CREATE OR REPLACE FUNCTION fn_set_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE OR REPLACE FUNCTION fn_es_admin_saas()
            RETURNS BOOLEAN AS $$
            BEGIN
                RETURN current_setting('app.current_user_role', true) = 'admin_saas';
            END;
            $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP FUNCTION IF EXISTS fn_es_admin_saas();
            DROP FUNCTION IF EXISTS fn_set_updated_at();
            DROP FUNCTION IF EXISTS fn_uuid_v8();
        SQL);
    }
};
