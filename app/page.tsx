"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [filter, setFilter] = useState<"all" | Location>("all");

  const total = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [],
  );
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = total ? (checkedCount / total) * 100 : 0;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // localStorage can be unavailable in private browsing modes.
    }
  }, [checked]);

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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold leading-tight">
          IMAS — документы на визу
        </h1>
        <p className="mt-1 text-[13px] leading-5 text-[#6b6a64]">
          Едут мама и сын, спонсор — мама. Зелёная метка — делается уже в
          Малайзии, фиолетовая — до вылета, оранжевая — перед посадкой на рейс.
        </p>
      </header>

      <section className="mt-4 flex items-center gap-3 rounded-xl border border-[#e3e1d8] bg-white px-4 py-3.5">
        <div className="h-2 flex-1 overflow-hidden rounded bg-[#eeece4]">
          <div
            className="h-full rounded bg-[#2e7d5b] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="min-w-14 text-right text-sm font-semibold">
          {checkedCount} / {total}
        </div>
      </section>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => {
          const active = filter === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={[
                "shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                active
                  ? "border-[#1a1a18] bg-[#1a1a18] text-white"
                  : "border-[#e3e1d8] bg-white text-[#6b6a64]",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-3">
        {groups.map((group) => {
          const visibleItems = group.items
            .map((item, index) => ({ ...item, id: `${group.key}_${index}` }))
            .filter((item) => filter === "all" || item.loc === filter);

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <section key={group.key} className="mt-6">
              <h2 className="mb-2 text-[15px] font-semibold leading-tight">
                {group.title}
              </h2>
              <div className="overflow-hidden rounded-xl border border-[#e3e1d8] bg-white">
                {visibleItems.map((item) => {
                  const isChecked = Boolean(checked[item.id]);

                  return (
                    <label
                      key={item.id}
                      htmlFor={item.id}
                      className={[
                        "flex cursor-pointer items-start gap-2.5 border-b border-[#eeece4] px-3.5 py-3 last:border-b-0",
                        isChecked ? "bg-[#f2f8f4]" : "bg-white",
                      ].join(" ")}
                    >
                      <input
                        id={item.id}
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) =>
                          toggleItem(item.id, event.target.checked)
                        }
                        className="mt-0.5 size-5 shrink-0 accent-[#2e7d5b]"
                      />
                      <span className="flex flex-col gap-1">
                        <span
                          className={[
                            "w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            badgeClasses[item.loc],
                          ].join(" ")}
                        >
                          {badgeLabels[item.loc]}
                        </span>
                        <span
                          className={[
                            "text-sm leading-5",
                            isChecked
                              ? "text-[#6b6a64] line-through"
                              : "text-[#1a1a18]",
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

      <button
        type="button"
        onClick={resetItems}
        className="mt-6 w-full rounded-xl border border-[#e3e1d8] bg-white p-3.5 text-[15px] font-semibold text-[#a33b3b]"
      >
        Сбросить все отметки
      </button>
      <p className="mt-2 pb-6 text-center text-xs leading-5 text-[#9b9a92]">
        Данные хранятся локально в этом браузере (localStorage). Если очистить
        историю браузера, отметки удалятся.
      </p>
    </main>
  );
}
