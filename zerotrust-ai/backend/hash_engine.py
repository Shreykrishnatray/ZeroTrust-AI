"""
ZeroTrust AI – Hash generation for uploaded documents.
Produces SHA-256 hash of document bytes for integrity and deduplication.
"""
import hashlib


def generate_document_hash(document_bytes: bytes) -> str:
    """
    Generate SHA-256 hash of the uploaded document (raw bytes).
    Returns the hash as a lowercase hexadecimal string.
    """
    if document_bytes is None:
        return hashlib.sha256(b"").hexdigest()
    return hashlib.sha256(document_bytes).hexdigest()
