import { COLORS } from "../constants/theme";

export const labelStyle = {
  color: COLORS.textMuted,
  fontFamily: "Orbitron_700Bold",
  fontSize: 10,
  letterSpacing: 2,
  marginBottom: 8,
} as const;

export const inputStyle = {
  backgroundColor: "#0a0a18",
  borderWidth: 1.5,
  borderColor: COLORS.borderSubtle,
  borderRadius: 12,
  padding: 14,
  color: COLORS.textPrimary,
  fontFamily: "Exo2_400Regular",
  fontSize: 15,
  marginBottom: 20,
} as const;
