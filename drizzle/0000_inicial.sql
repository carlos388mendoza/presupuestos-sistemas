CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alternativas" (
	"id" text PRIMARY KEY NOT NULL,
	"partida_id" text NOT NULL,
	"proveedor" text NOT NULL,
	"tipo_compra" text NOT NULL,
	"archivo_id" text,
	"notas" text DEFAULT '' NOT NULL,
	"elegida" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archivos" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre_original" text NOT NULL,
	"nombre_guardado" text NOT NULL,
	"mime" text NOT NULL,
	"tamano" integer NOT NULL,
	"subido_por" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "archivos_nombre_guardado_unique" UNIQUE("nombre_guardado")
);
--> statement-breakpoint
CREATE TABLE "equipos" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"marca" text DEFAULT '' NOT NULL,
	"modelo" text DEFAULT '' NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"categoria" text DEFAULT '' NOT NULL,
	"origen" text DEFAULT 'manual' NOT NULL,
	"revisado" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items_alternativa" (
	"id" text PRIMARY KEY NOT NULL,
	"alternativa_id" text NOT NULL,
	"equipo_id" text,
	"descripcion" text NOT NULL,
	"cantidad" double precision NOT NULL,
	"precio_unitario_centavos" integer NOT NULL,
	"moneda" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partidas" (
	"id" text PRIMARY KEY NOT NULL,
	"presupuesto_id" text NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presupuestos" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"restaurante" text NOT NULL,
	"tipo" text NOT NULL,
	"estado" text DEFAULT 'borrador' NOT NULL,
	"notas" text DEFAULT '' NOT NULL,
	"creado_por" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'creador' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alternativas" ADD CONSTRAINT "alternativas_partida_id_partidas_id_fk" FOREIGN KEY ("partida_id") REFERENCES "public"."partidas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alternativas" ADD CONSTRAINT "alternativas_archivo_id_archivos_id_fk" FOREIGN KEY ("archivo_id") REFERENCES "public"."archivos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_subido_por_user_id_fk" FOREIGN KEY ("subido_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_alternativa" ADD CONSTRAINT "items_alternativa_alternativa_id_alternativas_id_fk" FOREIGN KEY ("alternativa_id") REFERENCES "public"."alternativas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_alternativa" ADD CONSTRAINT "items_alternativa_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_presupuesto_id_presupuestos_id_fk" FOREIGN KEY ("presupuesto_id") REFERENCES "public"."presupuestos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_creado_por_user_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alternativas_partida_idx" ON "alternativas" USING btree ("partida_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alternativas_una_elegida_idx" ON "alternativas" USING btree ("partida_id") WHERE "alternativas"."elegida" = true;--> statement-breakpoint
CREATE INDEX "equipos_marca_modelo_idx" ON "equipos" USING btree ("marca","modelo");--> statement-breakpoint
CREATE INDEX "items_alternativa_idx" ON "items_alternativa" USING btree ("alternativa_id");--> statement-breakpoint
CREATE INDEX "partidas_presupuesto_idx" ON "partidas" USING btree ("presupuesto_id");--> statement-breakpoint
CREATE INDEX "presupuestos_creado_por_idx" ON "presupuestos" USING btree ("creado_por");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");