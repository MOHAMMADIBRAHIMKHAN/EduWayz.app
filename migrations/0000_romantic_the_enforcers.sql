CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"school_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"father_name" text NOT NULL,
	"father_occupation" text NOT NULL,
	"father_contact" text NOT NULL,
	"mother_name" text NOT NULL,
	"mother_occupation" text NOT NULL,
	"mother_contact" text NOT NULL,
	"current_address_line1" text NOT NULL,
	"current_address_line2" text,
	"current_city" text NOT NULL,
	"current_province" text NOT NULL,
	"current_postal_code" text NOT NULL,
	"current_country" text DEFAULT 'Saudi Arabia' NOT NULL,
	"permanent_address_line1" text NOT NULL,
	"permanent_address_line2" text,
	"permanent_city" text NOT NULL,
	"permanent_province" text NOT NULL,
	"permanent_postal_code" text NOT NULL,
	"permanent_country" text DEFAULT 'Saudi Arabia' NOT NULL,
	"emergency_name" text NOT NULL,
	"emergency_relation" text NOT NULL,
	"emergency_contact" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parents_parent_id_unique" UNIQUE("parent_id"),
	CONSTRAINT "parents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"school_name" text NOT NULL,
	"establishment_year" integer NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"website" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"province" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'Saudi Arabia' NOT NULL,
	"admin_name" text NOT NULL,
	"admin_position" text NOT NULL,
	"admin_email" text NOT NULL,
	"admin_phone" text NOT NULL,
	"school_type" text NOT NULL,
	"education_level" text NOT NULL,
	"language" text NOT NULL,
	"capacity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schools_school_id_unique" UNIQUE("school_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sid" text NOT NULL,
	"data" json NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "sessions_sid_unique" UNIQUE("sid")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"parent_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" timestamp NOT NULL,
	"gender" text NOT NULL,
	"grade" text NOT NULL,
	"section" text,
	"enrollment_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;