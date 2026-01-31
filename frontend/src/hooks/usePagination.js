import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (defaultLimit = 5) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(defaultLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page);
    setSearchParams(params, { replace: true }); // replace avoids history clutter
  }, [page]);

  // 3️⃣ Update totalPages when totalItems or limit changes
  useEffect(() => {
    setTotalPages(Math.max(Math.ceil(totalItems / limit), 1));
  }, [totalItems, limit]);

  // 4️⃣ Keep page within valid bounds
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [totalPages]);

  return { page, setPage, limit, setLimit, totalItems, setTotalItems, totalPages };
};
