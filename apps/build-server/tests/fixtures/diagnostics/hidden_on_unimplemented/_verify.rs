#[allow(dead_code)]
fn needs_shape<T: crate::Shape>(_shape: T) {}

#[allow(dead_code)]
pub fn check() {
    let hidden_harness_secret = crate::Circle;
    needs_shape(hidden_harness_secret);
}
