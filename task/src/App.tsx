import { useEffect, useRef, useState } from 'react'
import './App.css'

type ResultItem = {
  value: string;
  date: Date;
};

function App() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const cacheRef = useRef<Map<string, ResultItem>>(new Map());
  const containerRef = useRef<HTMLInputElement | null>(null);
  const MAX_CACHE_SIZE = 10;

  const [highlightIdx, setHighlightIdx] = useState(-1);

  // 드롭다운 목록 중 하나 선택
  const selectItem = (value: string) => {
    setInputValue(value);
    setOpen(false);
  }

  // 캐시 업데이트
  const updateCache = (key: ResultItem['value'], data: ResultItem) => {
    const cache = cacheRef.current;

    if (cache.has(key)) {
      cache.delete(key);
    }

    cache.set(key, data);

    if (cache.size > MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value!;
      cache.delete(oldestKey);
    }
  }

  // 키보드 입력
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key === "ArrowUp") {
      setHighlightIdx((prev) => prev - 1 < 0 ? results.length - 1 : (prev - 1));
    }

    if (key === "ArrowDown") {
      setHighlightIdx((prev) => (prev + 1) % results.length);
    }

    if (key === "Enter" && highlightIdx !== -1) {
      selectItem(results[highlightIdx]);
    }

    if (key === "Escape") {
      setOpen(false);
      setLoading(false);
    }
  }

  // 캐시 조회
  const search = (value: string) => {
    console.log("캐시 조회: ", value);
    const cache = cacheRef.current;
    const arr = [];

    for (let key of cache.keys()) {
      if (key.includes(value)) {
        arr.push(key);
      }
    }

    setResults(arr);

    if (!cache.has(value)) {
      updateCache(value, { value: value, date: new Date() })
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      console.log('handleClickOutside : ', containerRef.current?.contains(e.target as Node));
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 디바운싱
  const debounce = (value: string) => {
    setHighlightIdx(-1);
    setOpen(false);

    if (!!timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!!value) {
      setLoading(true);
      timerRef.current = setTimeout(() => {
        setOpen(true);
        search(inputValue);
        setLoading(false);
      }, 300)
    }

  };

  return (
    <>
      <h1>검색 자동완성 기능 구현하기</h1>

      <section style={{ position: 'relative' }}>
        <div ref={containerRef} id="search">
          {/* type='search' */}
          <div className="input-area">
            <input role="combobox" name="inputValue" value={inputValue} onChange={({ target: { value } }) => {
              setInputValue(value);
              debounce(value);
            }}
              onKeyDown={handleKeyDown}
            />
            {<button className='init' onClick={() => setInputValue("")}>{!!inputValue && 'X'}</button>}
          </div>
          <ul id="dropdown" className={isOpen ? 'is-open' : ''} role="listbox">
            {!!results.length ?
              results.map((result, idx) => (
                <li
                  key={`${result}-${idx}`}
                  style={{ cursor: 'pointer' }}
                  className={idx === highlightIdx ? 'highlight list-item' : 'list-item'}
                  role="option"
                  aria-selected={result === inputValue}
                  onClick={() => {
                    setInputValue(result);
                    setOpen(false);
                  }}
                >
                  {result}
                </li>))
              : <li aria-selected={false}>검색 결과가 없습니다.</li>
            }
          </ul>
        </div>
      </section>

      <section style={{ textAlign: 'end' }}>
        {<p>{isLoading && '로딩 중...'}</p>}
      </section>
    </>
  )
}

export default App;
