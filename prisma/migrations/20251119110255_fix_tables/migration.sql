/*
  Warnings:

  - You are about to drop the `OcrJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OcrJob" DROP CONSTRAINT "OcrJob_labReportId_fkey";

-- DropTable
DROP TABLE "public"."OcrJob";
