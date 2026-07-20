-- Add processing options for MCQ extraction pipeline
ALTER TABLE medgenius_documents ADD COLUMN processing_options_json TEXT;
