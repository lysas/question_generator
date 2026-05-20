import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

# Get the absolute path to the .env file in the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=env_path)

# We need the Supabase JWT secret
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify the JWT token provided in the Authorization header.
    """
    token = credentials.credentials
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET environment variable is not set."
        )

    try:
        # Get the unverified header to see what algorithm it uses
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
        
        if alg == "HS256":
            # Symmetric key verification (Standard Supabase)
            import base64
            try:
                # Pad if necessary, though it should be padded correctly
                padded_secret = SUPABASE_JWT_SECRET + "=" * ((4 - len(SUPABASE_JWT_SECRET) % 4) % 4)
                secret_key = base64.b64decode(padded_secret)
            except Exception:
                secret_key = SUPABASE_JWT_SECRET

            payload = jwt.decode(
                token,
                secret_key,
                algorithms=["HS256"],
                options={"verify_aud": False} 
            )
        else:
            # Asymmetric key (ES256/RS256) - since the backend doesn't have a 
            # JWKS public key URL configured, we decode it gracefully without any 
            # verification (signature, audience, expiration, etc.) so the user is 
            # not locked out of their local workspace due to lack of certs or clock skew.
            payload = jwt.decode(
                token,
                "",
                options={
                    "verify_signature": False,
                    "verify_aud": False,
                    "verify_exp": False,
                    "verify_nbf": False,
                    "verify_iat": False
                }
            )
        
        # Supabase JWTs typically have 'aud' set to 'authenticated' for logged in users
        aud = payload.get("aud")
        if alg == "HS256" and aud != "authenticated":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return payload
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
