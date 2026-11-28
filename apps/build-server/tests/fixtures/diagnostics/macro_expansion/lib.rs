macro_rules! double {
    ($value:expr) => {
        $value + "two"
    };
}

pub fn run() -> u64 {
    let n: u64 = 2;
    assert_eq!(n, "two");
    double!(n)
}
