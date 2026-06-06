output "s3_bucket_name" {
  description = "Name of the S3 bucket for document storage"
  value       = aws_s3_bucket.documents.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "ec2_public_ip" {
  description = "Public IP of the EC2 backend instance"
  value       = aws_eip.backend.public_ip
}

output "ecr_backend_repo" {
  description = "ECR repository URL for backend Docker images"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_lambda_repo" {
  description = "ECR repository URL for Lambda Docker images"
  value       = aws_ecr_repository.lambda.repository_url
}

output "lambda_function_name" {
  description = "Name of the PDF processing Lambda function"
  value       = aws_lambda_function.pdf_processor.function_name
}
