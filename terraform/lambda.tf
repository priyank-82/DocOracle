resource "aws_lambda_function" "pdf_processor" {
  function_name = "${var.project_name}-pdf-processor"

  package_type = "Image"
  image_uri    = "${aws_ecr_repository.lambda.repository_url}:latest"
  architectures = ["arm64"]

  role    = aws_iam_role.lambda_execution.arn
  timeout = var.lambda_timeout
  memory_size = var.lambda_memory

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DATABASE_URL             = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/docdb"
      S3_BUCKET_NAME           = aws_s3_bucket.documents.id
      TRANSFORMERS_CACHE       = "/tmp"
      SENTENCE_TRANSFORMERS_HOME = "/tmp"
      HF_HOME                  = "/tmp"
      HF_HUB_CACHE             = "/tmp"
      XDG_CACHE_HOME           = "/tmp"
    }
  }

  depends_on = [aws_ecr_repository.lambda]
}

resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda function"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pdf_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.documents.arn
}
