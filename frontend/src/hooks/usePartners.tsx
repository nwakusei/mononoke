import { useState, useEffect } from "react";
import api from "@/utils/api";

type Partner = {
  _id: string;
  name: string;
  nickname: string;
  logoImage: string;
  cashback: string;
  // outros campos que você precisa
};

function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    api.get("/partners/allpartners").then((response) => {
      setPartners(response.data.partners);
    });
  }, []);

  return {
    partners,
  };
}

export { usePartners };
