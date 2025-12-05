// src/components/Layout/Footer.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        height: 40,
        mt: 'auto',
        backgroundColor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="body2">&copy; {new Date().getFullYear()} Courrier Dashboard</Typography>
    </Box>
  );
};

export default Footer;
