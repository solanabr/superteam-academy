CREATE OR REPLACE FUNCTION increment_xp(wallet TEXT, amount INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (wallet_address, total_xp)
  VALUES (wallet, amount)
  ON CONFLICT (wallet_address)
  DO UPDATE SET total_xp = COALESCE(profiles.total_xp, 0) + amount,
                updated_at = now();
END;
$$;
