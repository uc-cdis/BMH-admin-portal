import pytest
import io
import json
import jwt
from unittest.mock import patch
from lambdas.lambda_authorizer import lambda_authorizer
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from jwcrypto import jwk


def test_validate_token():
    """
    Tests the functionality of validate token by creating a dummy JWT token using RS256 algorithm.
    Note: We also create an RSA key pair and a JWK for the public key for the test.
    """

    # Generate RSA private key
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    # # Serialize and save the private key
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # Get the public key from the private key and serialize to gerenate a pem
    public_key_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Convert public key PEM to JWK
    public_key_jwk = jwk.JWK.from_pem(public_key_pem).export_public(as_dict=True)
    public_key_jwk["alg"] = "RS256"
    keys = [public_key_jwk]

    mock_payload = {"name": "Test name", "aud": "Valid test audience"}

    # Encode the payload using the private key generated above while sharing the public key info as a header
    mock_jwt_token = jwt.encode(
        payload=mock_payload,
        algorithm="RS256",
        key=private_key_pem,
        headers={"kid": public_key_jwk["kid"]},
    )
    mock_keys_from_well_known_jwks = io.BytesIO(json.dumps({"keys": keys}).encode())

    with patch.object(
        lambda_authorizer, "urlopen", return_value=mock_keys_from_well_known_jwks
    ):
        payload = lambda_authorizer.validate_token(mock_jwt_token)

    assert payload == mock_payload
