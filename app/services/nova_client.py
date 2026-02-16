"""AWS Bedrock Nova client wrapper"""

import boto3
import json
import time
import logging
from typing import Dict, List, Any, Optional
from botocore.exceptions import ClientError
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class NovaClient:
    """Wrapper for AWS Bedrock API interactions"""

    def __init__(self):
        """Initialize AWS Bedrock client"""
        try:
            self.client = boto3.client(
                "bedrock-runtime",
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
            )
            self.model_id = settings.nova_model_id
            self.embedding_model_id = settings.titan_embedding_model_id
            logger.info("AWS Bedrock client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AWS Bedrock client: {str(e)}")
            raise

    def invoke_agent(
        self,
        prompt: str,
        system_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        reasoning_effort: str = "medium",
    ) -> Dict[str, Any]:
        """
        Invoke Nova 2 Lite model with given parameters

        Args:
            prompt: User/agent prompt text
            system_prompt: System instructions for agent behavior
            temperature: 0.0-1.0, controls randomness
            max_tokens: Maximum response length
            reasoning_effort: "low", "medium", or "high"

        Returns:
            Parsed JSON response from model
        """
        for attempt in range(settings.max_retries):
            try:
                # Construct request body for Nova 2 Lite
                request_body = {
                    "messages": [{"role": "user", "content": prompt}],
                    "system": [{"text": system_prompt}],
                    "inferenceConfig": {
                        "temperature": temperature,
                        "maxTokens": max_tokens,
                    },
                }

                # Add reasoning config based on effort level
                if reasoning_effort in ["low", "medium", "high"]:
                    request_body["thinkingConfig"] = {"effort": reasoning_effort}

                logger.info(f"Invoking Nova model (attempt {attempt + 1}/{settings.max_retries})")

                # Invoke model
                response = self.client.converse(
                    modelId=self.model_id,
                    messages=request_body["messages"],
                    system=request_body["system"],
                    inferenceConfig=request_body["inferenceConfig"],
                )

                # Extract response text
                response_text = response["output"]["message"]["content"][0]["text"]

                logger.info(f"Nova model invoked successfully")

                # Try to parse as JSON
                try:
                    # Clean up response text (remove markdown code blocks if present)
                    cleaned_text = response_text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]
                    if cleaned_text.startswith("```"):
                        cleaned_text = cleaned_text[3:]
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]
                    cleaned_text = cleaned_text.strip()

                    parsed_response = json.loads(cleaned_text)
                    return parsed_response

                except json.JSONDecodeError:
                    # If not JSON, return as text in a dict
                    logger.warning("Response is not valid JSON, returning as text")
                    return {"response": response_text, "raw_text": True}

            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code", "")
                error_message = e.response.get("Error", {}).get("Message", str(e))

                logger.error(f"AWS Bedrock error (attempt {attempt + 1}): {error_code} - {error_message}")

                # Check if we should retry
                if attempt < settings.max_retries - 1:
                    if error_code in ["ThrottlingException", "ServiceUnavailableException"]:
                        # Exponential backoff
                        wait_time = (2**attempt) * 1
                        logger.info(f"Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue

                # Return error response
                return {"error": f"{error_code}: {error_message}"}

            except Exception as e:
                logger.error(f"Unexpected error invoking Nova model: {str(e)}")

                if attempt < settings.max_retries - 1:
                    wait_time = (2**attempt) * 1
                    time.sleep(wait_time)
                    continue

                return {"error": f"Failed to invoke model: {str(e)}"}

        return {"error": "Max retries exceeded"}

    def generate_embeddings(self, text: str) -> List[float]:
        """
        Generate vector embeddings for text

        Args:
            text: Text to embed

        Returns:
            1536-dimensional embedding vector
        """
        try:
            # Truncate text if too long (Titan has limits)
            if len(text) > 8000:
                text = text[:8000]

            request_body = {"inputText": text}

            response = self.client.invoke_model(
                modelId=self.embedding_model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body),
            )

            response_body = json.loads(response["body"].read())
            embedding = response_body.get("embedding", [])

            logger.info(f"Generated embedding with {len(embedding)} dimensions")
            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            return []

    def check_connection(self) -> bool:
        """
        Check if AWS Bedrock connection is working

        Returns:
            True if connected, False otherwise
        """
        try:
            # Try a simple embedding generation
            test_embedding = self.generate_embeddings("test connection")
            return len(test_embedding) > 0
        except:
            return False
