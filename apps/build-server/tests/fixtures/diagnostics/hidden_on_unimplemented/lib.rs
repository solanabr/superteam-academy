mod _verify;

#[diagnostic::on_unimplemented(
    message = "Shape is missing",
    note = "learner note

 --> src/lib.rs:1:1"
)]
pub trait Shape {
    fn area(&self) -> u64;
}

pub struct Circle;
