/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { useEffect, useState } from "react";

interface UseAxiosParams {
  url: string;
  method?: "get" | "post" | "put" | "delete";
  body?: any;
  headers?: any;
}

interface UseAxiosReturn {
  data: any;
  error: any;
  loading: boolean;
}

function useAxios({
  url,
  method = "get",
  body = null,
  headers = null,
}: UseAxiosParams): UseAxiosReturn {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios({ url, method, data: body, headers });
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [url, method, body, headers]);

  return { data, error, loading };
}

export default useAxios;
