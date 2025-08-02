"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons

// React Hook Form, Zod e ZodResolver

function withdrawMoneyPage() {
  const [token] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/mononoke/check-user", {
        headers: {
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      })
      .then((response) => {
        setUser(response.data);
        setIsLoading(false);
      });
  }, [token]);

  const handleWithdrawMoney = async () => {
    try {
      const response = await api.post("/otakupay/withdraw-money");

      Swal.fire({
        title: "Importante!",
        text: response.data.message,
        icon: "info",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Error withdrawing money:", error);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
      <Sidebar />
      <div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4">
        <button onClick={handleWithdrawMoney} className="btn btn-primary">
          Botão
        </button>
      </div>
    </section>
  );
}

export default withdrawMoneyPage;
