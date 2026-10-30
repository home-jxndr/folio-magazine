// Ticker/marquee component
<div className="overflow-x-auto">
  <div className="no-scrollbar inline-flex items-center gap-8 animate-marquee">
    {items.map((item, index) => (
      <div key={item.id} className="min-w-[300px] px-4">
        <span className="kicker">{item.text}</span>
      </div>
    ))}
  </div>
</div>
