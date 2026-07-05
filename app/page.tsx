"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Location = "my" | "kz" | "flight";

type ChecklistEntry = {
  text: string;
  loc: Location;
};

type ChecklistGroup = {
  key: string;
  title: string;
  items: ChecklistEntry[];
};

const STORAGE_KEY = "imas_visa_checklist_state";

const groups: ChecklistGroup[] = [
  {
    key: "pre_flight",
    title: "Перед вылетом",
    items: [
      {
        text: "MDAC (Malaysia Digital Arrival Card) — обязательная электронная регистрация на каждого человека отдельно (маму и сына), включая детей. Подаётся строго за 3 дня (72 часа) до прилёта на imigresen-online.imi.gov.my/mdac/main, бесплатно. Без неё могут не пустить на посадку.",
        loc: "flight",
      },
    ],
  },
  {
    key: "student",
    title: "Виза студента",
    items: [
      { text: "4 фото 35x50мм на синем фоне (4 шт)", loc: "my" },
      {
        text: "Копия паспорта студента, все страницы, оригинал при себе, срок действия от 18 месяцев, свежее фото на странице с данными",
        loc: "kz",
      },
      { text: "Оплата медицинской страховки (оформляет школа)", loc: "my" },
      {
        text: "Копии паспортов обоих родителей: страница с данными, действующая виза, штампы въезда/выезда",
        loc: "my",
      },
      {
        text: "Оригинал письма о родственных связях от посольства в Малайзии на всех членов семьи внутри и вне страны",
        loc: "my",
      },
      {
        text: "Если родители разных гражданств — письма о родстве от каждого посольства",
        loc: "kz",
      },
      {
        text: "Оригинал свидетельства о рождении студента, переведённое на английский и заверенное в посольстве в Малайзии",
        loc: "kz",
      },
      {
        text: "Свидетельство о браке / разводе / смерти супруга, переведённое и заверенное в посольстве в Малайзии",
        loc: "kz",
      },
      {
        text: "При разводе — оригинал документа об опеке над детьми, переведённый и заверенный",
        loc: "kz",
      },
      { text: "Квитанция об оплате визового сбора", loc: "my" },
    ],
  },
  {
    key: "guardian_basic",
    title: "Виза опекуна — основные документы",
    items: [
      {
        text: "4 фото паспортного размера на синем фоне для каждого заявителя",
        loc: "my",
      },
      {
        text: "Оригинал паспорта каждого заявителя, действителен от даты подачи минимум 18 месяцев",
        loc: "kz",
      },
      {
        text: "Оригинал и копия письма о родстве из посольства в Малайзии на всех членов семьи",
        loc: "kz",
      },
      {
        text: "Переведённое и заверенное свидетельство о рождении на каждого ребёнка из письма о родстве",
        loc: "kz",
      },
      {
        text: "Переведённое и заверенное свидетельство о браке / разводе / смерти супруга",
        loc: "kz",
      },
      {
        text: "При разводе — оригинал документа об опеке, переведённый и заверенный",
        loc: "kz",
      },
    ],
  },
  {
    key: "guardian_passports",
    title: "Паспорта с действующей визой (мин. 30 дней)",
    items: [
      { text: "Студент — копия первой страницы паспорта и визы", loc: "kz" },
      {
        text: "Отец — копия страницы с данными и действующей визой (штампы въезда/выезда и авиабилет не нужны, так как он не едет)",
        loc: "kz",
      },
      {
        text: "Уточнить у школы: требуется ли нотариально заверенное согласие отца на выезд и проживание сына за границей без него",
        loc: "kz",
      },
      {
        text: "Если супруг(а) умер(ла) — оригинал свидетельства о смерти с переводом и заверением",
        loc: "kz",
      },
      {
        text: "Мать — копия всех страниц паспорта с действующей визой",
        loc: "kz",
      },
      {
        text: "Старый и новый паспорт — письмо-подтверждение от посольства",
        loc: "kz",
      },
    ],
  },
  {
    key: "finance",
    title: "Финансовое состояние (очень важно)",
    items: [
      {
        text: "Вариант А: местная банковская выписка (продление опекунства), оригинал печати и подписи банка, счёт активен в Малайзии, последние 3 месяца, остаток от 10 000 RM на конец каждого месяца с учётом переводов",
        loc: "kz",
      },
      {
        text: "Вариант Б: иностранная банковская выписка мамы как нового опекуна, оригинал печати посольства или банка, последние 3 месяца, остаток от 10 000 RM",
        loc: "kz",
      },
      {
        text: "Если счёт формально на имя отца — копия его карты, которой пользуется мама + 3 чека снятия по 500 RM с международного счёта, включённые в выписку",
        loc: "kz",
      },
      {
        text: "Чеки расходов в Малайзии за последние 3 месяца (продукты, личные покупки, онлайн-покупки)",
        loc: "my",
      },
    ],
  },
  {
    key: "finance_extra",
    title: "Дополнительные документы к финансовой части",
    items: [
      {
        text: 'Уточнить в visainquiry@imas.edu.my: примут ли справку с работы мамы вместо отца, раз спонсор — она (в форме школы указано "for the father")',
        loc: "kz",
      },
      {
        text: "Справка с места работы (мамы либо отца — в зависимости от ответа школы)",
        loc: "kz",
      },
      {
        text: "Оригиналы счетов за электричество и воду за 3 месяца подряд, желательно на имя мамы (по копии за каждый месяц)",
        loc: "my",
      },
      {
        text: "Оригиналы квитанций об оплате аренды жилья за 3 месяца подряд",
        loc: "my",
      },
      {
        text: "Оригинал договора аренды от 1 года на имя мамы или сына, подписи арендатора и арендодателя, штамп LHDN (+ продление, если есть)",
        loc: "my",
      },
      {
        text: "Для нового опекуна — квитанция депозита за аренду, включая коммунальные",
        loc: "my",
      },
      { text: "3 последние квитанции об оплате обучения в школе", loc: "kz" },
      {
        text: "Если выписка от детей, обучающихся в Малайзии — копия их паспорта с визой + имя в письме о родстве",
        loc: "kz",
      },
    ],
  },
  {
    key: "final",
    title: "Страховка, оплата, декларация",
    items: [
      {
        text: "Медицинская страховка, оформленная в Малайзии (только от школы)",
        loc: "my",
      },
      {
        text: "Квитанция об оплате визы: 650 RM (стандарт) или 700 RM (Китай, Индия, Бангладеш)",
        loc: "my",
      },
      { text: "Оплата страховки отдельной квитанцией", loc: "my" },
      {
        text: "2 формы декларации об отсутствии работы в Малайзии и об источнике дохода (выдаёт школа)",
        loc: "my",
      },
    ],
  },
];

const filters: { key: "all" | Location; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "my", label: "Малайзия" },
  { key: "kz", label: "До вылета" },
  { key: "flight", label: "Перед рейсом" },
];

const badgeClasses: Record<Location, string> = {
  my: "bg-[#e3f0e7] text-[#1f6b3f]",
  kz: "bg-[#eae7fb] text-[#4a3fa8]",
  flight: "bg-[#fdeee0] text-[#a85b17]",
};

const badgeLabels: Record<Location, string> = {
  my: "Малайзия",
  kz: "До вылета",
  flight: "Перед рейсом",
};

export default function Home() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | Location>("all");
  const [navVisible, setNavVisible] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const lastScrollY = useRef(0);

  const total = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [],
  );
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = total ? (checkedCount / total) * 100 : 0;
  const remainingCount = total - checkedCount;
  const activeFilterLabel =
    filters.find((item) => item.key === filter)?.label ?? "Все";
  const visibleTotal = groups.reduce(
    (sum, group) =>
      sum +
      group.items.filter((item) => filter === "all" || item.loc === filter)
        .length,
    0,
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        setChecked(saved ? JSON.parse(saved) : {});
      } catch {
        setChecked({});
      } finally {
        setStorageReady(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // localStorage can be unavailable in private browsing modes.
    }
  }, [checked, storageReady]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 24) {
        setNavVisible(true);
      } else if (Math.abs(delta) > 8) {
        setNavVisible(delta < 0);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleItem(id: string, value: boolean) {
    setChecked((current) => ({ ...current, [id]: value }));
  }

  function resetItems() {
    if (!window.confirm("Сбросить все отметки?")) {
      return;
    }

    setChecked({});
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef7ef_0,#f6f3ea_34%,#f3f4f2_100%)]">
      <nav
        className={[
          "fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl transition-transform duration-300",
          navVisible ? "translate-y-0" : "-translate-y-full",
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase text-[#2e7d5b]">
              IMAS
            </p>
            <p className="truncate text-sm font-semibold text-[#1a1a18] sm:text-base">
              Документы на визу
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#e3e1d8] bg-[#f8f7f2] p-1 md:flex">
            {filters.map((item) => {
              const active = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={[
                    "rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "bg-[#1a1a18] text-white"
                      : "text-[#6b6a64] hover:bg-white hover:text-[#1a1a18]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#1a1a18] px-3 py-2 text-xs font-semibold text-white shadow-sm">
            <span>{checkedCount}</span>
            <span className="text-white/45">/</span>
            <span>{total}</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-20 sm:px-6 sm:pb-12 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
          <div className="rounded-[28px] border border-white/70 bg-[#1d2a22] p-5 text-white shadow-[0_24px_70px_rgba(29,42,34,0.16)] sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/85">
                Мама + сын
              </span>
              <span className="rounded-full bg-[#d8efe0] px-3 py-1 text-xs font-semibold text-[#1f6b3f]">
                Спонсор — мама
              </span>
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              IMAS — документы на визу
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
              Собранный чек-лист по визе студента и опекуна: что готовить до
              вылета, что делать уже в Малайзии и что закрыть перед рейсом.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-semibold">{checkedCount}</p>
                <p className="mt-1 text-[11px] font-medium text-white/58">
                  готово
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-semibold">{remainingCount}</p>
                <p className="mt-1 text-[11px] font-medium text-white/58">
                  осталось
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-semibold">
                  {Math.round(progress)}%
                </p>
                <p className="mt-1 text-[11px] font-medium text-white/58">
                  прогресс
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-[#e4e0d6] bg-white/85 p-5 shadow-[0_18px_50px_rgba(42,38,26,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#8b877b]">
                  Статус
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#1a1a18]">
                  {checkedCount} из {total}
                </p>
              </div>
              <div className="grid size-16 place-items-center rounded-full bg-[#edf6ef] text-sm font-bold text-[#2e7d5b]">
                {Math.round(progress)}%
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#ebe8dd]">
              <div
                className="h-full rounded-full bg-[#2e7d5b] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-[#f2f8f4] p-3">
                <p className="text-lg font-semibold text-[#1f6b3f]">
                  {groups.flatMap((group) => group.items).filter((item) => item.loc === "my").length}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#6b6a64]">
                  MY
                </p>
              </div>
              <div className="rounded-2xl bg-[#f1effb] p-3">
                <p className="text-lg font-semibold text-[#4a3fa8]">
                  {groups.flatMap((group) => group.items).filter((item) => item.loc === "kz").length}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#6b6a64]">
                  KZ
                </p>
              </div>
              <div className="rounded-2xl bg-[#fff0e2] p-3">
                <p className="text-lg font-semibold text-[#a85b17]">
                  {groups.flatMap((group) => group.items).filter((item) => item.loc === "flight").length}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#6b6a64]">
                  Рейс
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="sticky top-[72px] z-30 mt-4 rounded-2xl border border-[#e4e0d6] bg-white/90 p-2 shadow-sm backdrop-blur md:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {filters.map((item) => {
              const active = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={[
                    "shrink-0 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-[#1a1a18] text-white"
                      : "bg-[#f6f4ed] text-[#6b6a64]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-3 rounded-3xl border border-[#e4e0d6] bg-white/70 p-3 shadow-[0_18px_50px_rgba(42,38,26,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            <p className="text-xs font-bold uppercase text-[#8b877b]">
              Сейчас показано
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1a1a18]">
              {activeFilterLabel}: {visibleTotal} пунктов
            </p>
          </div>
          <button
            type="button"
            onClick={resetItems}
            className="rounded-2xl border border-[#ead5d5] bg-white px-4 py-3 text-sm font-semibold text-[#a33b3b] transition-colors hover:bg-[#fff6f6]"
          >
            Сбросить отметки
          </button>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {groups.map((group) => {
            const visibleItems = group.items
              .map((item, index) => ({ ...item, id: `${group.key}_${index}` }))
              .filter((item) => filter === "all" || item.loc === filter);

            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <section
                key={group.key}
                className="overflow-hidden rounded-3xl border border-[#e4e0d6] bg-white shadow-[0_18px_45px_rgba(42,38,26,0.05)]"
              >
                <div className="border-b border-[#eeece4] bg-[#fbfaf6] px-4 py-3.5 sm:px-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[15px] font-semibold leading-snug text-[#1a1a18] sm:text-base">
                      {group.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-[#eeece4] px-2.5 py-1 text-xs font-semibold text-[#6b6a64]">
                      {visibleItems.length}
                    </span>
                  </div>
                </div>
                <div>
                  {visibleItems.map((item) => {
                    const isChecked = Boolean(checked[item.id]);

                    return (
                      <label
                        key={item.id}
                        htmlFor={item.id}
                        className={[
                          "group flex min-h-20 cursor-pointer items-start gap-3 border-b border-[#eeece4] px-4 py-4 transition-colors last:border-b-0 sm:px-5",
                          isChecked
                            ? "bg-[#f2f8f4]"
                            : "bg-white hover:bg-[#fbfaf6]",
                        ].join(" ")}
                      >
                        <input
                          id={item.id}
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) =>
                            toggleItem(item.id, event.target.checked)
                          }
                          className="mt-1 size-5 shrink-0 accent-[#2e7d5b]"
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-2">
                          <span
                            className={[
                              "w-fit rounded-full px-2.5 py-1 text-[11px] font-bold",
                              badgeClasses[item.loc],
                            ].join(" ")}
                          >
                            {badgeLabels[item.loc]}
                          </span>
                          <span
                            className={[
                              "text-sm leading-6 sm:text-[15px]",
                              isChecked
                                ? "text-[#77746b] line-through"
                                : "text-[#24231f]",
                            ].join(" ")}
                          >
                            {item.text}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mx-auto mt-6 max-w-xl pb-6 text-center text-xs leading-5 text-[#8b877b]">
          Данные хранятся локально в этом браузере. Если очистить историю
          браузера, отметки удалятся.
        </p>
      </main>
    </div>
  );
}
