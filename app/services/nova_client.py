"""AWS Bedrock Nova client wrapper"""

import boto3
import json
import time
import logging
import base64
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
            client_kwargs = {
                "region_name": settings.aws_region,
            }

            # Only set explicit credentials when both key and secret are provided.
            # Otherwise boto3's default credential chain is used.
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                client_kwargs["aws_access_key_id"] = settings.aws_access_key_id
                client_kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
                if settings.aws_session_token:
                    client_kwargs["aws_session_token"] = settings.aws_session_token

            self.client = boto3.client("bedrock-runtime", **client_kwargs)
            # Enforce Nova Pro for financial reasoning/calculation quality.
            # If not configured, fall back to explicit Nova Pro model id.
            self.model_id = settings.nova_pro_model_id or "amazon.nova-pro-v1:0"
            self.sonic_model_id = settings.nova_sonic_model_id or "amazon.nova-sonic-v1:0"
            self.embedding_model_id = settings.titan_embedding_model_id
            logger.info(f"AWS Bedrock client initialized successfully (model={self.model_id})")
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
        Invoke Nova model with given parameters

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
                logger.info(f"Invoking Nova model (attempt {attempt + 1}/{settings.max_retries})")

                # Invoke model via converse API
                response = self.client.converse(
                    modelId=self.model_id,
                    messages=[{"role": "user", "content": [{"text": prompt}]}],
                    system=[{"text": system_prompt}],
                    inferenceConfig={
                        "temperature": temperature,
                        "maxTokens": max_tokens,
                    },
                )

                # Extract response text from converse API response
                content_blocks = response["output"]["message"]["content"]
                response_text = "".join(
                    block["text"] for block in content_blocks if "text" in block
                )

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

    def synthesize_speech_with_sonic(
        self,
        text: str,
        voice_id: str = "Matthew",
        audio_format: str = "mp3",
    ) -> Dict[str, Any]:
        """
        Synthesize speech from text using Nova Sonic.

        Returns:
            {"audio_base64": "...", "mime_type": "audio/mpeg"}
            or {"error": "..."}
        """
        if not text or not text.strip():
            return {"error": "Cannot synthesize empty text"}

        text = text.strip()
        if len(text) > 3500:
            text = text[:3500]

        payload_variants = [
            {
                "inputText": text,
                "audioGenerationConfig": {
                    "voiceId": voice_id,
                    "audioFormat": audio_format,
                },
            },
            {
                "messages": [{"role": "user", "content": [{"text": text}]}],
                "outputModalities": ["AUDIO"],
                "audioConfig": {
                    "voiceId": voice_id,
                    "format": audio_format,
                },
            },
            {
                "input": {"text": text},
                "speech": {
                    "voiceId": voice_id,
                    "format": audio_format,
                },
            },
        ]

        for idx, payload in enumerate(payload_variants):
            try:
                # Variant 1: try receiving binary audio directly.
                response = self.client.invoke_model(
                    modelId=self.sonic_model_id,
                    contentType="application/json",
                    accept="audio/mpeg" if audio_format.lower() == "mp3" else "application/octet-stream",
                    body=json.dumps(payload),
                )
                raw_audio = response["body"].read()
                if raw_audio:
                    return {
                        "audio_base64": base64.b64encode(raw_audio).decode("utf-8"),
                        "mime_type": "audio/mpeg" if audio_format.lower() == "mp3" else "audio/wav",
                    }
            except Exception as direct_audio_exc:
                logger.warning(
                    "Nova Sonic direct audio attempt %s failed: %s",
                    idx + 1,
                    str(direct_audio_exc),
                )

            try:
                # Variant 2: try receiving JSON with audio payload in body.
                response = self.client.invoke_model(
                    modelId=self.sonic_model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(payload),
                )
                response_body = json.loads(response["body"].read())
                audio_base64 = (
                    response_body.get("audio")
                    or response_body.get("audioBase64")
                    or response_body.get("output", {}).get("audio")
                    or response_body.get("outputAudio")
                )
                if audio_base64:
                    return {
                        "audio_base64": audio_base64,
                        "mime_type": "audio/mpeg" if audio_format.lower() == "mp3" else "audio/wav",
                    }
            except Exception as json_audio_exc:
                logger.warning(
                    "Nova Sonic JSON audio attempt %s failed: %s",
                    idx + 1,
                    str(json_audio_exc),
                )

        return {
            "error": "Nova Sonic speech synthesis failed for all supported request formats",
        }
